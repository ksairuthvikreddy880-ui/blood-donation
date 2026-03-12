import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-display text-lg font-bold text-foreground">
            Instant Blood Connect
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">How It Works</a>
          <a href="#trust" className="hover:text-foreground transition-colors">Why Trust Us</a>
          <a href="#stats" className="hover:text-foreground transition-colors">Impact</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <a href="/auth" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
            Sign In
          </a>
          <a href="/auth" className="px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity">
            Register Now
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <a href="#how" className="block text-foreground font-medium" onClick={() => setOpen(false)}>How It Works</a>
              <a href="#trust" className="block text-foreground font-medium" onClick={() => setOpen(false)}>Why Trust Us</a>
              <a href="#stats" className="block text-foreground font-medium" onClick={() => setOpen(false)}>Impact</a>
              <hr className="border-border" />
              <a href="/auth" className="block text-foreground font-medium" onClick={() => setOpen(false)}>Sign In</a>
              <a href="/auth" className="block w-full text-center py-3 bg-primary text-primary-foreground rounded-xl font-semibold" onClick={() => setOpen(false)}>
                Register Now
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
