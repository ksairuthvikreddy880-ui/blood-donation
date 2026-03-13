import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Heart, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface DonorRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonorRegistrationModal = ({ isOpen, onClose }: DonorRegistrationModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    bloodGroup: "",
    phone: "",
    email: user?.email || "",
    city: "",
    pincode: "",
    lastDonationDate: "",
    availability: true,
    consent: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.consent) {
      toast({
        title: "Consent Required",
        description: "Please agree to be contacted for blood donation requests",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update profile with donor information
      const { error } = await supabase
        .from("profiles")
        .update({
          name: formData.fullName,
          blood_group: formData.bloodGroup,
          phone: formData.phone,
          city: formData.city,
          last_donation_date: formData.lastDonationDate || null,
          availability: formData.availability ? "available" : "unavailable",
          verified: false, // Default to unverified
        })
        .eq("user_id", user?.id);

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Registration Successful!",
        description: "Thank you for becoming a blood donor. You can update your availability anytime.",
      });

      setTimeout(() => {
        onClose();
        setSuccess(false);
        // Reset form
        setFormData({
          fullName: "",
          bloodGroup: "",
          phone: "",
          email: user?.email || "",
          city: "",
          pincode: "",
          lastDonationDate: "",
          availability: true,
          consent: false,
        });
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-elevated"
          >
            {success ? (
              <div className="p-6 sm:p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <CheckCircle className="w-16 sm:w-20 h-16 sm:h-20 text-green-600 mx-auto mb-4 sm:mb-6" />
                </motion.div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2 sm:mb-3">
                  Thank You for Joining!
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg">
                  You are now registered as a blood donor.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  You can update your availability anytime from your dashboard.
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-4 sm:p-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-primary" fill="currentColor" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg sm:text-2xl font-bold text-foreground">
                        Become a Donor
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Join our life-saving community
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 sm:w-6 h-5 sm:h-6" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      required
                    />
                  </div>

                  {/* Blood Group */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                      Blood Group <span className="text-red-500">*</span>
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

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring opacity-60 cursor-not-allowed text-sm"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground mt-1">Auto-filled from your account</p>
                    </div>
                  </div>

                  {/* City & Pincode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
                        Area / Pincode
                      </label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                      />
                    </div>
                  </div>

                  {/* Last Donation Date */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                      Last Donation Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={formData.lastDonationDate}
                      onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    />
                  </div>

                  {/* Availability Toggle */}
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-secondary rounded-xl">
                    <div>
                      <p className="font-medium text-foreground text-sm">Availability Status</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Mark yourself as available for donations
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, availability: !formData.availability })}
                      className={`relative w-12 sm:w-14 h-7 sm:h-8 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center ${
                        formData.availability ? "bg-green-600" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-5 sm:w-6 h-5 sm:h-6 bg-white rounded-full transition-transform ${
                          formData.availability ? "translate-x-5 sm:translate-x-6" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-secondary rounded-xl">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={formData.consent}
                      onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                      className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-ring min-h-[44px] min-w-[44px] flex items-center justify-center"
                      required
                    />
                    <label htmlFor="consent" className="text-xs sm:text-sm text-foreground">
                      I agree to be contacted for blood donation requests and understand that my
                      information will be shared with verified recipients in emergency situations.{" "}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-semibold text-base sm:text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    {loading && <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />}
                    <span className="hidden sm:inline">{loading ? "Registering..." : "Register as Donor"}</span>
                    <span className="sm:hidden">{loading ? "Registering..." : "Register"}</span>
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DonorRegistrationModal;
