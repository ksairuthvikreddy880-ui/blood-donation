import { Heart, Shield, Clock, MapPin, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: Users,
    title: "Register",
    description: "Sign up as a donor or recipient in under 2 minutes with location auto-detect.",
  },
  {
    icon: MapPin,
    title: "Search Nearby",
    description: "Find matching blood donors within your radius using smart location matching.",
  },
  {
    icon: Zap,
    title: "Send Request",
    description: "Send a request or trigger an emergency broadcast to all nearby donors.",
  },
  {
    icon: Heart,
    title: "Save a Life",
    description: "Connect with verified donors, coordinate, and earn Blood Credits for your contribution.",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const HowItWorks = () => {
  return (
    <section className="py-24 px-4 bg-secondary/50">
      <div className="container max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Simple Process
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground">
            How It Works
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto text-lg">
            From registration to saving lives — just four simple steps.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={item}
              className="relative bg-card rounded-2xl p-8 shadow-card border border-border/50 hover:border-primary/20 transition-colors group"
            >
              <div className="absolute -top-4 -left-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm font-display">
                {index + 1}
              </div>
              <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <step.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
