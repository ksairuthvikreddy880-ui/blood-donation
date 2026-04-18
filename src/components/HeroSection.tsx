import { motion } from "framer-motion";
import { Search, ArrowRight, Droplets } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import heroBg from "@/assets/hero-bg.jpg";
import DonorRegistrationModal from "./DonorRegistrationModal";
import RequestBloodModal from "./RequestBloodModal";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const HeroSection = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const handleFindBlood = () => {
    if (user) setIsRequestModalOpen(true);
    else navigate("/auth");
  };

  const handleRegisterDonor = () => {
    if (user) setIsDonorModalOpen(true);
    else navigate("/auth");
  };

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* ── Ken Burns Background ── */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0 ken-burns"
          style={{
            backgroundImage: `url(${heroBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "brightness(0.72)",
          }}
        />
        <div className="absolute inset-0 bg-black/45" />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 40%, hsl(0 72% 10% / 0.55) 100%)",
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="flex items-center justify-between gap-8">
          {/* Left: text */}
          <div className="max-w-3xl flex-1">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Droplets className="w-4 h-4 text-red-400" />
              <span>Smart Emergency Blood Platform</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-6 drop-shadow-lg">
              Find Blood Donors{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #ff6b6b, #ff2d2d)" }}>
                Instantly
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/80 max-w-xl mb-10 leading-relaxed drop-shadow">
              Connect with verified blood donors near you in seconds. Every second counts when saving a life.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-12">
            <button onClick={handleFindBlood}
              className="group flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-display font-semibold text-lg shadow-emergency transition-all duration-200">
              <Search className="w-5 h-5" />
              Find Blood Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={handleRegisterDonor}
              className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-2xl font-display font-semibold text-lg transition-all duration-200">
              Register as Donor
            </button>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-wrap gap-2">
            <span className="text-sm text-white/60 mr-2 self-center">Blood groups:</span>
            {bloodGroups.map((group) => (
              <span key={group}
                className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-semibold text-white hover:bg-red-600/40 hover:border-red-400/50 cursor-pointer transition-all duration-200">
                {group}
              </span>
            ))}
          </motion.div>
        </div>

          {/* Right: animation — no container, raw Lottie */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.3 }}
            className="hidden lg:block flex-shrink-0"
          >
            <DotLottieReact
              key={location.key}
              src="/online-doctor.lottie"
              loop={false}
              autoplay
              style={{ width: 420, height: 420 }}
            />
          </motion.div>

        </div>
      </div>

      <DonorRegistrationModal isOpen={isDonorModalOpen} onClose={() => setIsDonorModalOpen(false)} />
      <RequestBloodModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} />
    </section>
  );
};

export default HeroSection;
