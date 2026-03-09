import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Clock, MapPin, User, Phone, CheckCircle, XCircle, Loader2, Edit, X, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RequestWithAcceptances {
  id: string;
  blood_group: string;
  urgency: string;
  city: string | null;
  status: string;
  created_at: string;
  notes: any;
  units_fulfilled: number;
  acceptances: Array<{
    id: string;
    donor: {
      name: string;
      phone: string;
      blood_group: string;
    };
    units_committed: number;
    status: string;
    created_at: string;
  }>;
}

interface MyRequestsSectionProps {
  userId: string;
}

const MyRequestsSection = ({ userId }: MyRequestsSectionProps) => {
  const [requests, setRequests] = useState<RequestWithAcceptances[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRequest, setEditingRequest] = useState<RequestWithAcceptances | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [editForm, setEditForm] = useState({
    patientName: "",
    bloodGroup: "",
    unitsRequired: 1,
    hospitalName: "",
    hospitalAddress: "",
    urgency: "urgent",
    contactPerson: "",
    contactPhone: "",
    city: "",
  });

  useEffect(() => {
    fetchMyRequests();
  }, [userId]);

  const fetchMyRequests = async () => {
    try {
      // Try to fetch with acceptances first
      const { data, error } = await supabase
        .from("blood_requests")
        .select(`
          *,
          acceptances:donor_acceptances(
            id,
            units_committed,
            status,
            created_at,
            donor:profiles!donor_acceptances_donor_id_fkey(
              name,
              phone,
              blood_group
            )
          )
        `)
        .eq("requester_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        // If donor_acceptances table doesn't exist, fetch without it
        if (error.message.includes('donor_acceptances')) {
          const { data: simpleData, error: simpleError } = await supabase
            .from("blood_requests")
            .select('*')
            .eq("requester_id", userId)
            .order("created_at", { ascending: false });

          if (simpleError) throw simpleError;

          const formattedData = simpleData?.map((req) => ({
            ...req,
            notes: typeof req.notes === 'string' ? JSON.parse(req.notes) : req.notes,
            acceptances: [], // No acceptances available yet
          })) || [];

          setRequests(formattedData);
          return;
        }
        throw error;
      }

      const formattedData = data?.map((req) => ({
        ...req,
        notes: typeof req.notes === 'string' ? JSON.parse(req.notes) : req.notes,
      })) || [];

      setRequests(formattedData);
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const urgencyColors = {
    critical: "bg-red-100 text-red-700 border-red-300",
    urgent: "bg-orange-100 text-orange-700 border-orange-300",
    normal: "bg-blue-100 text-blue-700 border-blue-300",
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-blue-100 text-blue-700",
    fulfilled: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-700",
  };

  const handleEditClick = (request: RequestWithAcceptances) => {
    setEditingRequest(request);
    setEditForm({
      patientName: request.notes?.patientName || "",
      bloodGroup: request.blood_group,
      unitsRequired: request.notes?.unitsRequired || 1,
      hospitalName: request.notes?.hospitalName || "",
      hospitalAddress: request.notes?.hospitalAddress || "",
      urgency: request.urgency,
      contactPerson: request.notes?.contactPerson || "",
      contactPhone: request.notes?.contactPhone || "",
      city: request.city || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingRequest) return;

    setSaving(true);
    try {
      const updatedNotes = {
        ...editingRequest.notes,
        patientName: editForm.patientName,
        unitsRequired: editForm.unitsRequired,
        hospitalName: editForm.hospitalName,
        hospitalAddress: editForm.hospitalAddress,
        contactPerson: editForm.contactPerson,
        contactPhone: editForm.contactPhone,
      };

      const { error } = await supabase
        .from("blood_requests")
        .update({
          blood_group: editForm.bloodGroup,
          urgency: editForm.urgency,
          city: editForm.city,
          notes: JSON.stringify(updatedNotes),
        })
        .eq("id", editingRequest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Blood request updated successfully",
      });

      setEditingRequest(null);
      fetchMyRequests();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update request",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground">No blood requests yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create a request to find donors
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map((request, index) => {
        const unitsRequired = request.notes?.unitsRequired || 1;
        const unitsRemaining = unitsRequired - (request.units_fulfilled || 0);

        return (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-soft"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="text-xl font-bold">{request.blood_group}</span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {request.notes?.patientName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {request.notes?.hospitalName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleEditClick(request)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  title="Edit Request"
                >
                  <Edit className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                </button>
                <div className="text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      statusColors[request.status as keyof typeof statusColors]
                    }`}
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Request Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Units Needed</p>
                <p className="font-semibold text-foreground">{unitsRequired}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Units Fulfilled</p>
                <p className="font-semibold text-green-600">{request.units_fulfilled || 0}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                <p className="font-semibold text-orange-600">{unitsRemaining}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Urgency</p>
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${
                    urgencyColors[request.urgency as keyof typeof urgencyColors]
                  }`}
                >
                  {request.urgency.charAt(0).toUpperCase() + request.urgency.slice(1)}
                </span>
              </div>
            </div>

            {/* Accepted Donors */}
            {request.acceptances && request.acceptances.length > 0 ? (
              <div>
                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Accepted Donors ({request.acceptances.length})
                </h4>
                <div className="space-y-3">
                  {request.acceptances.map((acceptance: any) => (
                    <div
                      key={acceptance.id}
                      className="bg-secondary/50 border border-border rounded-xl p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                            {acceptance.donor.blood_group}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {acceptance.donor.name}
                            </p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {acceptance.donor.phone}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {acceptance.units_committed} unit(s)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(acceptance.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Waiting for donors to accept...</span>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Edit Request Modal */}
      <AnimatePresence>
        {editingRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elevated"
            >
              {/* Header */}
              <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Edit Blood Request
                </h2>
                <button
                  onClick={() => setEditingRequest(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Patient Name
                    </label>
                    <input
                      type="text"
                      value={editForm.patientName}
                      onChange={(e) => setEditForm({ ...editForm, patientName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Blood Group
                    </label>
                    <select
                      value={editForm.bloodGroup}
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
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

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Units Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={editForm.unitsRequired}
                      onChange={(e) => setEditForm({ ...editForm, unitsRequired: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Urgency
                    </label>
                    <select
                      value={editForm.urgency}
                      onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    value={editForm.hospitalName}
                    onChange={(e) => setEditForm({ ...editForm, hospitalName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Hospital Address
                  </label>
                  <textarea
                    value={editForm.hospitalAddress}
                    onChange={(e) => setEditForm({ ...editForm, hospitalAddress: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={editForm.contactPerson}
                      onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={editForm.contactPhone}
                      onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditingRequest(null)}
                    className="flex-1 px-4 py-3 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving}
                    className="flex-1 px-4 py-3 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving && <Save className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyRequestsSection;
