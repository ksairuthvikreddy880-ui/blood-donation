import { Heart, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";

const EmergencyButton = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleEmergency = async () => {
    if (!user) { navigate("/auth"); return; }

    if (!profile?.blood_group) {
      toast({
        title: "Blood group not set",
        description: "Please update your profile with your blood group first.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    try {
      // Create emergency request
      const request = await db.requests.create({
        user_id: user.id,
        blood_group: profile.blood_group,
        location: profile.city ?? undefined,
        urgency: "critical",
        units_needed: 1,
      });

      // Match available donors and notify them
      const matches = await db.matches.createForRequest(request.id, profile.blood_group);

      // Notify each matched donor
      await Promise.all(
        matches.map((m: any) =>
          db.notifications.create({
            user_id: m.donor_id,
            title: "🚨 Emergency Blood Request",
            message: `Urgent: ${profile.blood_group} blood needed near ${profile.city ?? "your area"}.`,
            type: "match",
            request_id: request.id,
          })
        )
      );

      toast({
        title: "Emergency request sent!",
        description: `${matches.length} donor(s) notified. Help is on the way.`,
      });

      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5, type: "spring" }}
      className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8"
    >
      <button
        onClick={handleEmergency}
        disabled={loading}
        className="group relative flex items-center gap-3 bg-primary text-primary-foreground px-6 py-4 rounded-2xl shadow-emergency hover:scale-105 active:scale-95 transition-transform animate-pulse-emergency disabled:opacity-70"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" fill="currentColor" />}
        <span className="font-display font-bold text-sm md:text-base">Emergency</span>
      </button>
    </motion.div>
  );
};

export default EmergencyButton;
