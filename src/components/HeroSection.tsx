import { motion } from "framer-motion";
import { Search, ArrowRight, Droplets } from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-pattern" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10 py-12 sm:py-16">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-medium mb-5 sm:mb-6">
              <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Smart Emergency Blood Platform</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1] mb-4 sm:mb-6">
              Find Blood Donors{" "}
              <span className="text-gradient-primary">Instantly</span>
            </h1>

            {/* Subline */}
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-xl mb-8 sm:mb-10 leading-relaxed">
              Connect with verified blood donors near you in seconds. Every second counts when saving a life.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 sm:mb-12"
          >
            <Link
              to="/auth"
              className="group inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-display font-semibold text-base sm:text-lg shadow-emergency hover:opacity-90 transition-opacity"
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              Find Blood Now
              <ArrowRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center justify-center gap-2 bg-card text-foreground border border-border px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-display font-semibold text-base sm:text-lg shadow-soft hover:bg-secondary transition-colors"
            >
              Register as Donor
            </Link>
          </motion.div>

          {/* Blood group pills */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            <span className="text-sm text-muted-foreground mr-1 self-center">Blood groups:</span>
            {bloodGroups.map((group) => (
              <span
                key={group}
                className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm font-semibold text-foreground hover:border-primary/30 hover:bg-accent cursor-pointer transition-colors"
              >
                {group}
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
