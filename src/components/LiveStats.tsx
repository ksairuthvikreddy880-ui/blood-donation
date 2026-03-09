import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Droplets, Heart, MapPin, Activity } from "lucide-react";

const statsData = [
  { icon: Droplets, label: "Donors Registered", target: 12480, suffix: "+" },
  { icon: Heart, label: "Lives Saved", target: 3250, suffix: "+" },
  { icon: MapPin, label: "Cities Covered", target: 185, suffix: "" },
  { icon: Activity, label: "Active Now", target: 342, suffix: "" },
];

const useCountUp = (target: number, duration: number = 2000, start: boolean = false) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration, start]);

  return count;
};

const StatItem = ({ icon: Icon, label, target, suffix, delay }: {
  icon: typeof Droplets;
  label: string;
  target: number;
  suffix: string;
  delay: number;
}) => {
  const [inView, setInView] = useState(false);
  const count = useCountUp(target, 2000, inView);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      onViewportEnter={() => setInView(true)}
      className="text-center"
    >
      <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <div className="font-display text-4xl md:text-5xl font-bold text-foreground">
        {count.toLocaleString()}{suffix}
      </div>
      <p className="mt-2 text-muted-foreground font-medium">{label}</p>
    </motion.div>
  );
};

const LiveStats = () => {
  return (
    <section className="py-24 px-4 bg-secondary/50">
      <div className="container max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary">
            Real Impact
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-3 text-foreground">
            Live Statistics
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
          {statsData.map((stat, index) => (
            <StatItem key={stat.label} {...stat} delay={index * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LiveStats;
