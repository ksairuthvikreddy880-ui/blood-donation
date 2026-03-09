import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Phone, Building2, User, Check, X, Loader2 } from "lucide-react";
import { BloodRequestWithDetails } from "@/utils/donorMatching";
import { acceptBloodRequest, declineBloodRequest } from "@/utils/donorMatching";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface BloodRequestCardProps {
  request: BloodRequestWithDetails;
  onAccept: () => void;
  onDecline: () => void;
}

const BloodRequestCard = ({ request, onAccept, onDecline }: BloodRequestCardProps) => {
  const { toast } = useToast();
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      // Get current user ID from auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const result = await acceptBloodRequest(request.id, user.id, 1);
      if (result.success) {
        toast({
          title: "Request Accepted!",
          description: "The requester will be notified. Contact details are now visible.",
        });
        onAccept();
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({
        title: "Failed to Accept",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    setDeclining(true);
    try {
      await declineBloodRequest(request.id);
      toast({
        title: "Request Declined",
        description: "This request has been hidden from your list.",
      });
      onDecline();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeclining(false);
    }
  };

  const urgencyColors = {
    critical: "bg-red-100 text-red-700 border-red-300",
    urgent: "bg-orange-100 text-orange-700 border-orange-300",
    normal: "bg-blue-100 text-blue-700 border-blue-300",
  };

  const urgencyLabels = {
    critical: "Critical",
    urgent: "Urgent",
    normal: "Scheduled",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-card border-2 border-primary/20 rounded-2xl p-6 shadow-soft hover:shadow-card transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="text-2xl font-bold">{request.blood_group}</span>
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">
              Blood Needed
            </h3>
            <p className="text-sm text-muted-foreground">
              {request.notes?.unitsRequired || 1} unit(s) required
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${
            urgencyColors[request.urgency as keyof typeof urgencyColors]
          }`}
        >
          {urgencyLabels[request.urgency as keyof typeof urgencyLabels]}
        </span>
      </div>

      {/* Patient Info */}
      <div className="space-y-3 mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">Patient:</span>
          <span className="text-muted-foreground">{request.notes?.patientName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">Hospital:</span>
          <span className="text-muted-foreground">{request.notes?.hospitalName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">Location:</span>
          <span className="text-muted-foreground">
            {request.city}
            {request.distance > 0 && ` • ${Math.round(request.distance * 10) / 10} km away`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground font-medium">Posted:</span>
          <span className="text-muted-foreground">
            {new Date(request.created_at).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Contact Info (Hidden until accepted) */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <div className="flex items-start gap-2">
          <Phone className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-900 mb-1">Contact Information</p>
            <p className="text-blue-700">
              Contact details will be revealed after you accept this request
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAccept}
          disabled={accepting || declining}
          className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {accepting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Accepting...
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              Accept Request
            </>
          )}
        </button>

        <button
          onClick={handleDecline}
          disabled={accepting || declining}
          className="px-6 py-3 bg-secondary text-foreground border border-border rounded-xl font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {declining ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Important Note */}
      <p className="text-xs text-muted-foreground mt-3 text-center">
        By accepting, you commit to donating blood. Please ensure you're available.
      </p>
    </motion.div>
  );
};

export default BloodRequestCard;
