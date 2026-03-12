import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const EmergencyButton = () => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5, type: "spring" }}
      className="fixed bottom-6 right-6 z-50 md:bottom-8 md:right-8"
    >
      <button className="group relative flex items-center gap-3 bg-primary text-primary-foreground px-6 py-4 rounded-2xl shadow-emergency hover:scale-105 active:scale-95 transition-transform animate-pulse-emergency">
        <Heart className="w-5 h-5" fill="currentColor" />
        <span className="font-display font-bold text-sm md:text-base">
          Emergency
        </span>
      </button>
    </motion.div>
  );
};

export default EmergencyButton;
