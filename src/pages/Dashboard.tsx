import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, User, MapPin, Droplets, LogOut, Clock, Phone, Edit, Activity, AlertCircle, Save, X, Search, Bell, Users, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DonorRegistrationModal from "@/components/DonorRegistrationModal";
import DonorStatusBadge from "@/components/DonorStatusBadge";
import PublicProfilePreview from "@/components/PublicProfilePreview";
import RequestBloodModal from "@/components/RequestBloodModal";
import BloodRequestCard from "@/components/BloodRequestCard";
import MyRequestsSection from "@/components/MyRequestsSection";
import { getPendingRequestsForDonor, BloodRequestWithDetails } from "@/utils/donorMatching";

interface Profile {
  name: string;
  blood_group: string | null;
  phone: string | null;
  city: string | null;
  blood_credits: number;
  last_donation_date: string | null;
  availability: string;
  verified: boolean;
  visibility?: string;
}

interface BloodRequest {
  id: string;
  blood_group: string;
  urgency: string;
  city: string | null;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    city: '',
    blood_group: ''
  });
  const [saving, setSaving] = useState(false);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isRequestBloodOpen, setIsRequestBloodOpen] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<BloodRequestWithDetails[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchRequests();
      fetchIncomingRequests();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setEditForm({
        name: data.name || '',
        phone: data.phone || '',
        city: data.city || '',
        blood_group: data.blood_group || ''
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('blood_requests')
        .select('*')
        .eq('requester_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      console.error('Failed to load requests:', error);
    }
  };

  const fetchIncomingRequests = async () => {
    if (!user) return;
    try {
      // Fetch ALL pending blood requests from other users
      const { data, error } = await supabase
        .from('blood_requests')
        .select(`
          *,
          requester:profiles!blood_requests_requester_id_fkey(name, phone)
        `)
        .neq('requester_id', user.id) // Exclude own requests
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Format the data
      const formattedRequests = data?.map((req: any) => {
        const notes = typeof req.notes === 'string' ? JSON.parse(req.notes) : req.notes;
        return {
          id: req.id,
          blood_group: req.blood_group,
          urgency: req.urgency,
          city: req.city,
          status: req.status,
          created_at: req.created_at,
          latitude: req.latitude,
          longitude: req.longitude,
          radius_km: req.radius_km,
          notes: notes,
          units_fulfilled: req.units_fulfilled || 0,
          requester: Array.isArray(req.requester) ? req.requester[0] : req.requester,
          distance: 0, // We'll show all requests regardless of distance
        };
      }) || [];

      setIncomingRequests(formattedRequests);
    } catch (error: any) {
      console.error('Failed to load incoming requests:', error);
      // Silently fail if donor_acceptances table doesn't exist yet
      setIncomingRequests([]);
    }
  };

  const handleEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: editForm.name,
          phone: editForm.phone,
          city: editForm.city,
          blood_group: editForm.blood_group,
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });

      setIsEditOpen(false);
      fetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;

    const newStatus = profile.availability === 'available' ? 'unavailable' : 'available';

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ availability: newStatus })
        .eq('user_id', user?.id);

      if (error) throw error;

      setProfile({ ...profile, availability: newStatus });
      toast({
        title: "Status Updated",
        description: `You are now ${newStatus === 'available' ? 'available' : 'unavailable'} for donations`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Red Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, #c0030d 0%, #8B0000 60%, #5a0000 100%)',
        }}
      />
      
      {/* Content Overlay */}
      <div className="relative z-10">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Dashboard</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleAvailability}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                profile?.availability === 'available'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                profile?.availability === 'available' ? 'bg-green-600' : 'bg-gray-600'
              }`} />
              {profile?.availability === 'available' ? 'Available' : 'Unavailable'}
            </button>
            <button
              onClick={() => setIsDonorModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Heart className="w-4 h-4" fill="currentColor" />
              Become a Donor
            </button>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">
                Welcome back, {profile?.name || 'User'}!
              </h1>
            </div>
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{profile?.blood_credits || 0}</p>
                <p className="text-white/70">Credits</p>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{requests.length}</p>
                <p className="text-white/70">Requests</p>
              </div>
              <div className="w-px h-12 bg-white/30" />
              <div className="text-center">
                <p className="text-2xl font-bold text-green-300">
                  {profile?.availability === 'available' ? '✓' : '—'}
                </p>
                <p className="text-white/70">Available</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Donor Status Section */}
        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-card/95 backdrop-blur-sm border border-border rounded-xl p-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-foreground mb-3">
                  Donor Visibility Status
                </h3>
                <DonorStatusBadge 
                  profile={{
                    availability: profile.availability,
                    visibility: profile.visibility,
                    verified: profile.verified,
                    last_donation_date: profile.last_donation_date,
                  }} 
                  showDescription={true}
                />
              </div>
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-secondary text-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
              >
                <Eye className="w-5 h-5" />
                Preview Public Profile
              </button>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Profile Summary Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <User className="w-6 h-6" />
                </div>
                <button 
                  onClick={() => setIsEditOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg">Profile</h3>
              <div className="mt-3 space-y-2 text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Blood Group:</span>{" "}
                  {profile?.blood_group || "Not set"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Phone:</span>{" "}
                  {profile?.phone || "Not set"}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">City:</span>{" "}
                  {profile?.city || "Not set"}
                </p>
              </div>
            </motion.div>

            {/* Blood Credits Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Droplets className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg">Blood Credits</h3>
              <p className="text-3xl font-bold text-primary mt-2">{profile?.blood_credits || 0}</p>
              <p className="text-muted-foreground text-sm mt-1">Credits earned from donations</p>
            </motion.div>

            {/* Location Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow cursor-pointer"
            >
              <Link to="/blood-centres" className="block">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-lg">Find Donors</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Search nearby verified donors in {profile?.city || "your area"}
                </p>
              </Link>
            </motion.div>

            {/* Donation Cooldown Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-6 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-foreground text-lg">Last Donation</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {profile?.last_donation_date 
                  ? new Date(profile.last_donation_date).toLocaleDateString()
                  : "No donations yet"}
              </p>
              <p className="text-xs text-muted-foreground mt-2">90-day safety tracking</p>
            </motion.div>
          </>
        )}
        </div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="font-display text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/blood-centres">
              <button className="w-full bg-primary text-primary-foreground rounded-xl p-6 hover:opacity-90 transition-opacity text-left group">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">Find Donors</h3>
                <p className="text-sm opacity-90">Search for blood donors near you</p>
              </button>
            </Link>

            <button 
              onClick={() => setIsRequestBloodOpen(true)}
              className="bg-card border-2 border-primary text-foreground rounded-xl p-6 hover:bg-primary/5 transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-1">Request Blood</h3>
              <p className="text-sm text-muted-foreground">Create an emergency blood request</p>
            </button>

            <Link to="/blood-requests">
              <button className="w-full bg-card border border-border text-foreground rounded-xl p-6 hover:shadow-soft transition-shadow text-left group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Droplets className="w-6 h-6" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">View All Requests</h3>
                <p className="text-sm text-muted-foreground">Browse all blood requests</p>
              </button>
            </Link>
          </div>
        </motion.div>

        {/* All Blood Requests (For Everyone) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary" />
              All Blood Requests
              {incomingRequests.length > 0 && (
                <span className="ml-2 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
                  {incomingRequests.length}
                </span>
              )}
            </h2>
          </div>

          {incomingRequests.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No blood requests available</p>
              <p className="text-sm text-muted-foreground mt-1">
                Blood requests from other users will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AnimatePresence>
                {incomingRequests.map((request) => (
                  <BloodRequestCard
                    key={request.id}
                    request={request}
                    onAccept={() => fetchIncomingRequests()}
                    onDecline={() => fetchIncomingRequests()}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Recent Activity Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary" />
              My Blood Requests
            </h2>
          </div>

          <MyRequestsSection userId={user?.id || ''} />
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-elevated"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-foreground">Edit Profile</h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">City</label>
                <input
                  type="text"
                  value={editForm.city}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Blood Group</label>
                <select
                  value={editForm.blood_group}
                  onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Save className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </div>

      {/* Donor Registration Modal */}
      <DonorRegistrationModal 
        isOpen={isDonorModalOpen} 
        onClose={() => {
          setIsDonorModalOpen(false);
          fetchProfile(); // Refresh profile after registration
        }} 
      />

      {/* Public Profile Preview Modal */}
      {profile && (
        <PublicProfilePreview
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          profile={{
            name: profile.name,
            blood_group: profile.blood_group,
            phone: profile.phone,
            city: profile.city,
            last_donation_date: profile.last_donation_date,
            verified: profile.verified,
          }}
        />
      )}

      {/* Request Blood Modal */}
      <RequestBloodModal
        isOpen={isRequestBloodOpen}
        onClose={() => {
          setIsRequestBloodOpen(false);
          fetchRequests(); // Refresh requests after submission
        }}
      />
    </div>
  );
};

export default Dashboard;
