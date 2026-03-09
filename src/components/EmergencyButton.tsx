import { Heart } from "lucide-react";
import { motion } from "framer-motion";

const EmergencyButton = () => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.5, type: "spring" }}
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 z-50"
    >
      <button className="group relative flex items-center gap-2 sm:gap-3 bg-primary text-primary-foreground px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-emergency hover:scale-105 active:scale-95 transition-transform animate-pulse-emergency">
        <Heart className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" />
        <span className="font-display font-bold text-xs sm:text-sm md:text-base whitespace-nowrap">
          Emergency SOS
        </span>
      </button>
    </motion.div>
  );
};

export default EmergencyButton;
