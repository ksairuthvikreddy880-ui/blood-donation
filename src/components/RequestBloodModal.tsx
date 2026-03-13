import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle, Loader2, MapPin, Navigation } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface RequestBloodModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RequestBloodModal = ({ isOpen, onClose }: RequestBloodModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [formData, setFormData] = useState({
    patientName: "",
    bloodGroup: "",
    unitsRequired: 1,
    hospitalName: "",
    hospitalAddress: "",
    urgency: "urgent",
    contactPerson: "",
    contactPhone: "",
    city: "",
    pincode: "",
    latitude: null as number | null,
    longitude: null as number | null,
    radius: 10,
  });

  const detectLocation = () => {
    setDetectingLocation(true);

    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Please enter your location manually",
        variant: "destructive",
      });
      setDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        toast({
          title: "Location Detected",
          description: "Your location has been set successfully",
        });
        setDetectingLocation(false);
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Please enter your location manually",
          variant: "destructive",
        });
        setDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "Location Required",
        description: "Please detect your location or enter city/pincode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create blood request
      const { data: requestData, error: requestError } = await supabase
        .from("blood_requests")
        .insert({
          requester_id: user?.id,
          blood_group: formData.bloodGroup,
          urgency: formData.urgency as "normal" | "urgent" | "critical",
          radius_km: formData.radius,
          latitude: formData.latitude,
          longitude: formData.longitude,
          city: formData.city,
          status: "pending" as const,
          notes: JSON.stringify({
            patientName: formData.patientName,
            unitsRequired: formData.unitsRequired,
            hospitalName: formData.hospitalName,
            hospitalAddress: formData.hospitalAddress,
            contactPerson: formData.contactPerson,
            contactPhone: formData.contactPhone,
            pincode: formData.pincode,
          }),
        })
        .select()
        .single();

      if (requestError) throw requestError;

      toast({
        title: "Request Submitted Successfully!",
        description: "We're notifying nearby donors. You'll be contacted soon.",
      });

      onClose();
      
      // Reset form
      setFormData({
        patientName: "",
        bloodGroup: "",
        unitsRequired: 1,
        hospitalName: "",
        hospitalAddress: "",
        urgency: "urgent",
        contactPerson: "",
        contactPhone: "",
        city: "",
        pincode: "",
        latitude: null,
        longitude: null,
        radius: 10,
      });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full h-full max-h-[90vh] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-elevated"
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">
                    Request Blood
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Fill in the details to find nearby donors
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 sm:w-6 h-5 sm:h-6" />
                </button>
              </div>

              {/* Form - Scrollable */}
              <div className="flex-1 overflow-y-auto">
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Patient Information */}
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Patient Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.patientName}
                          onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Blood Group Needed <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.bloodGroup}
                          onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
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

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Units Required <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={formData.unitsRequired}
                          onChange={(e) => setFormData({ ...formData, unitsRequired: parseInt(e.target.value) })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Urgency Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.urgency}
                          onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          required
                        >
                          <option value="normal">Scheduled</option>
                          <option value="urgent">Urgent</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Hospital Information */}
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                      Hospital Information
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Hospital Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.hospitalName}
                          onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Hospital Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.hospitalAddress}
                          onChange={(e) => setFormData({ ...formData, hospitalAddress: e.target.value })}
                          rows={2}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Contact Person <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.contactPerson}
                          onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Contact Phone <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          value={formData.contactPhone}
                          onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="font-display text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">
                      Location
                    </h3>
                    
                    <button
                      type="button"
                      onClick={detectLocation}
                      disabled={detectingLocation}
                      className="w-full mb-3 sm:mb-4 py-3 bg-primary/10 text-primary border-2 border-primary/20 rounded-xl font-medium hover:bg-primary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm min-h-[44px]"
                    >
                      {detectingLocation ? (
                        <>
                          <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                          <span className="hidden sm:inline">Detecting Location...</span>
                          <span className="sm:hidden">Detecting...</span>
                        </>
                      ) : (
                        <>
                          <Navigation className="w-4 sm:w-5 h-4 sm:h-5" />
                          <span className="hidden sm:inline">Auto-Detect My Location</span>
                          <span className="sm:hidden">Auto-Detect</span>
                        </>
                      )}
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Pincode
                        </label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                          Search Radius (km)
                        </label>
                        <select
                          value={formData.radius}
                          onChange={(e) => setFormData({ ...formData, radius: parseInt(e.target.value) })}
                          className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        >
                          <option value={5}>5 km</option>
                          <option value={10}>10 km</option>
                          <option value={15}>15 km</option>
                          <option value={20}>20 km</option>
                        </select>
                      </div>
                    </div>

                    {formData.latitude && formData.longitude && (
                      <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm text-green-600">
                        <MapPin className="w-4 h-4" />
                        <span>Location detected successfully</span>
                      </div>
                    )}
                  </div>

                  {/* Important Notice */}
                  <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-blue-900">
                        <p className="font-medium mb-1">Important:</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Only verified and eligible donors will be notified</li>
                          <li>Donors must be available and within your search radius</li>
                          <li>You'll be notified when donors accept your request</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {loading && <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />}
                    <span className="hidden sm:inline">{loading ? "Submitting Request..." : "Submit Blood Request"}</span>
                    <span className="sm:hidden">{loading ? "Submitting..." : "Submit Request"}</span>
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RequestBloodModal;
