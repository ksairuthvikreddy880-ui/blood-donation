import { motion } from "framer-motion";
import { Search, ArrowRight, Droplets } from "lucide-react";
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

      <div className="container max-w-6xl mx-auto px-4 relative z-10">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <Droplets className="w-4 h-4" />
              <span>Smart Emergency Blood Platform</span>
            </div>

            <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-[1.1] mb-6">
              Find Blood Donors{" "}
              <span className="text-gradient-primary">Instantly</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
              Connect with verified blood donors near you in seconds. Every second counts when saving a life.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 mb-12"
          >
            <button className="group flex items-center justify-center gap-3 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-display font-semibold text-lg shadow-emergency hover:opacity-90 transition-opacity">
              <Search className="w-5 h-5" />
              Find Blood Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="flex items-center justify-center gap-2 bg-card text-foreground border border-border px-8 py-4 rounded-2xl font-display font-semibold text-lg shadow-soft hover:bg-secondary transition-colors">
              Register as Donor
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-wrap gap-2"
          >
            <span className="text-sm text-muted-foreground mr-2 self-center">Blood groups:</span>
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
