import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, Droplets, Calendar, Shield } from "lucide-react";
import { maskPhoneNumber, getAreaOnly, daysSinceLastDonation } from "@/utils/donorEligibility";

interface PublicProfilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    name: string;
    blood_group: string | null;
    phone: string | null;
    city: string | null;
    last_donation_date: string | null;
    verified: boolean;
  };
}

const PublicProfilePreview = ({ isOpen, onClose, profile }: PublicProfilePreviewProps) => {
  const daysSince = profile.last_donation_date 
    ? daysSinceLastDonation(profile.last_donation_date)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-elevated"
          >
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Public Profile Preview
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  This is how you appear in donor search
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Profile Card Preview */}
            <div className="p-6">
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-6">
                {/* Blood Group Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">
                      {profile.blood_group || "?"}
                    </span>
                  </div>
                  {profile.verified && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      <Shield className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                </div>

                {/* Donor Name */}
                <h3 className="font-display text-xl font-semibold text-foreground mb-4">
                  {profile.name}
                </h3>

                {/* Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">
                      {getAreaOnly(profile.city)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {maskPhoneNumber(profile.phone)}
                    </span>
                    <span className="text-xs text-muted-foreground italic">
                      (Hidden for privacy)
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <Droplets className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-foreground">
                      Blood Group: {profile.blood_group || "Not set"}
                    </span>
                  </div>

                  {profile.last_donation_date && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-foreground">
                        Last donated {daysSince} days ago
                      </span>
                    </div>
                  )}
                </div>

                {/* Contact Button (Preview) */}
                <button
                  disabled
                  className="w-full mt-6 py-3 bg-primary/20 text-primary rounded-lg font-medium text-sm cursor-not-allowed"
                >
                  Contact Donor (Requires Request)
                </button>
              </div>

              {/* Privacy Notice */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Privacy Protected:</strong> Your full phone number and exact address are hidden. 
                  They will only be shared after you accept a donation request.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PublicProfilePreview;
