import { useAuth } from "@/contexts/AuthContext";
import { Heart, MapPin, Clock, Phone, Droplets, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BloodRequest {
  id: string;
  blood_group: string;
  urgency: 'critical' | 'urgent' | 'normal';
  city: string | null;
  status: string;
  units_fulfilled: number | null;
  created_at: string;
  requester_id: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  accepted_donor_id: string | null;
  radius_km?: number | null;
  updated_at?: string;
  profiles: {
    name: string;
  };
}

const BloodRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'fulfilled'>('all');
  const [acceptedRequests, setAcceptedRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchBloodRequests();
    fetchAcceptedRequests();

    // Set up real-time subscription for new blood requests
    const channel = supabase
      .channel('blood_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blood_requests'
        },
        (payload) => {
          console.log('Blood request change detected:', payload);
          // Refresh the list when any change occurs
          fetchBloodRequests();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBloodRequests = async () => {
    try {
      setLoading(true);
      
      // First, get all blood requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('blood_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching blood requests:', requestsError);
        throw requestsError;
      }

      // Then, get all unique requester profiles
      if (requestsData && requestsData.length > 0) {
        const requesterIds = [...new Set(requestsData.map(r => r.requester_id))];
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, name')
          .in('user_id', requesterIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
        }

        // Merge the data
        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]) || []);
        const mergedData = requestsData.map(request => ({
          ...request,
          profiles: profilesMap.get(request.requester_id) || { name: 'Unknown' }
        })) as BloodRequest[];

        console.log('Fetched blood requests:', mergedData);
        setRequests(mergedData);
      } else {
        setRequests([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch blood requests:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch blood requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAcceptedRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('donor_acceptances' as any)
        .select('request_id')
        .eq('donor_id', user?.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const acceptedIds = new Set(data?.map((d: any) => d.request_id) || []);
      setAcceptedRequests(acceptedIds);
    } catch (error: any) {
      console.error('Failed to fetch accepted requests:', error);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'bg-red-500';
      case 'urgent': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'fulfilled': return 'text-green-600 bg-green-50';
      case 'closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const parseNotes = (notes: string) => {
    try {
      return JSON.parse(notes);
    } catch {
      return {};
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const handleAcceptRequest = async (requestId: string) => {
    const isAccepted = acceptedRequests.has(requestId);
    const request = requests.find(r => r.id === requestId);

    try {
      if (isAccepted) {
        // Remove acceptance (toggle off)
        const { error } = await supabase
          .from('donor_acceptances' as any)
          .delete()
          .eq('request_id', requestId)
          .eq('donor_id', user?.id);

        if (error) throw error;

        // Update local state
        const newAccepted = new Set(acceptedRequests);
        newAccepted.delete(requestId);
        setAcceptedRequests(newAccepted);

        toast({
          title: "Acceptance Removed",
          description: "You have withdrawn your acceptance for this request.",
        });
      } else {
        // Check if acceptance already exists
        const { data: existingAcceptance } = await supabase
          .from('donor_acceptances' as any)
          .select('id')
          .eq('request_id', requestId)
          .eq('donor_id', user?.id)
          .single();

        if (existingAcceptance) {
          // Already exists, just update local state
          const newAccepted = new Set(acceptedRequests);
          newAccepted.add(requestId);
          setAcceptedRequests(newAccepted);
        } else {
          // Add new acceptance
          const { error } = await supabase
            .from('donor_acceptances' as any)
            .insert({
              request_id: requestId,
              donor_id: user?.id,
              status: 'accepted'
            });

          if (error) throw error;

          // Update local state
          const newAccepted = new Set(acceptedRequests);
          newAccepted.add(requestId);
          setAcceptedRequests(newAccepted);
        }

        toast({
          title: "Success",
          description: "You have accepted this blood request.",
        });

        // Open WhatsApp to notify requester
        if (request) {
          const notes = parseNotes(request.notes);
          sendWhatsAppMessage(request, notes);
        }
      }

      // Refresh the list
      fetchBloodRequests();
    } catch (error: any) {
      console.error('Error updating acceptance:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const sendWhatsAppMessage = async (request: BloodRequest, notes: any) => {
    const phoneNumber = notes.contactPhone?.replace(/\D/g, '');
    
    if (!phoneNumber) {
      console.log('No contact phone number available');
      toast({
        title: "No Phone Number",
        description: "Contact phone number is not available for this request.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get donor profile for name
      const { data: donorProfile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('user_id', user?.id)
        .single();

      const donorName = donorProfile?.name || 'A donor';
      const donorPhone = donorProfile?.phone || 'Not provided';
      
      // Create WhatsApp message
      const message = `🩸 Blood Donor Alert!

Hello! I'm ${donorName} and I have accepted your blood donation request.

Request Details:
• Patient: ${notes.patientName || 'N/A'}
• Blood Group: ${request.blood_group}
• Units Required: ${notes.unitsRequired || 1}
• Hospital: ${notes.hospitalName || 'N/A'}
• Location: ${notes.hospitalAddress || 'N/A'}

My Contact:
📞 ${donorPhone}

I will contact you shortly to coordinate the donation. Thank you for using our blood donation platform!`;

      // Format phone number with country code (India +91)
      const formattedPhone = phoneNumber.startsWith('91') ? phoneNumber : '91' + phoneNumber.slice(-10);
      
      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
      
      console.log('Opening WhatsApp URL:', whatsappUrl);
      console.log('Phone number:', formattedPhone);
      
      window.open(whatsappUrl, '_blank');

      toast({
        title: "WhatsApp Opened",
        description: "Please send the message to notify the requester.",
      });
    } catch (error: any) {
      console.error('Error opening WhatsApp:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-10">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-white" fill="currentColor" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Blood Requests</h1>
                  <p className="text-sm text-gray-600">View all blood donation requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All ({requests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'pending' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pending ({requests.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilter('fulfilled')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'fulfilled' 
                ? 'bg-red-500 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Fulfilled ({requests.filter(r => r.status === 'fulfilled').length})
          </button>
        </div>

        {/* Requests Table */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <Droplets className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No blood requests found</h3>
            <p className="text-gray-600">There are no {filter !== 'all' ? filter : ''} blood requests at the moment.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Patient Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Blood Group
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Hospital
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Requested By
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((request) => {
                    const notes = parseNotes(request.notes);
                    return (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{notes.patientName || 'N/A'}</div>
                        {notes.hospitalName && (
                          <div className="text-xs text-gray-500 mt-1">at {notes.hospitalName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Droplets className="w-4 h-4 text-red-500" fill="currentColor" />
                          <span className="text-sm font-bold text-red-600">{request.blood_group}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <span className="font-semibold">{request.units_fulfilled}</span> / {notes.unitsRequired || 1}
                        </div>
                        <div className="text-xs text-gray-500">units</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold text-white ${getUrgencyColor(request.urgency)}`}>
                          {request.urgency.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{notes.hospitalName || 'N/A'}</div>
                        <div className="text-xs text-gray-500 mt-1">{notes.hospitalAddress || ''}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          {request.city || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{notes.contactPerson || 'N/A'}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {notes.contactPhone || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{request.profiles?.name || 'Unknown'}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(request.status)}`}>
                          {request.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {request.status === 'pending' && request.requester_id !== user?.id && (
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
                              acceptedRequests.has(request.id)
                                ? 'bg-gray-500 hover:bg-gray-600'
                                : 'bg-green-500 hover:bg-green-600'
                            }`}
                          >
                            <Heart className="w-4 h-4" fill={acceptedRequests.has(request.id) ? 'currentColor' : 'none'} />
                            {acceptedRequests.has(request.id) ? 'Accepted' : 'Accept'}
                          </button>
                        )}
                        {request.requester_id === user?.id && (
                          <span className="text-xs text-gray-500">Your request</span>
                        )}
                        {request.status !== 'pending' && request.requester_id !== user?.id && (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodRequests;
