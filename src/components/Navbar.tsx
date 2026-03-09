import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 min-w-0 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-display text-base sm:text-lg font-bold text-foreground">
            <span className="hidden xs:inline">Instant Blood Connect</span>
            <span className="xs:hidden">IBC</span>
          </span>
        </a>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-medium text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors whitespace-nowrap">How It Works</a>
          <a href="#trust" className="hover:text-foreground transition-colors whitespace-nowrap">Why Trust Us</a>
          <a href="#stats" className="hover:text-foreground transition-colors whitespace-nowrap">Impact</a>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/auth" className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors">
            Sign In
          </Link>
          <Link to="/auth" className="px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity whitespace-nowrap">
            Register Now
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 -mr-2 text-foreground rounded-lg hover:bg-secondary transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-1">
              <a href="#how" className="flex items-center min-h-[48px] text-foreground font-medium px-3 rounded-lg hover:bg-secondary transition-colors" onClick={() => setOpen(false)}>How It Works</a>
              <a href="#trust" className="flex items-center min-h-[48px] text-foreground font-medium px-3 rounded-lg hover:bg-secondary transition-colors" onClick={() => setOpen(false)}>Why Trust Us</a>
              <a href="#stats" className="flex items-center min-h-[48px] text-foreground font-medium px-3 rounded-lg hover:bg-secondary transition-colors" onClick={() => setOpen(false)}>Impact</a>
              <div className="pt-3 border-t border-border space-y-2">
                <Link to="/auth" className="flex items-center min-h-[48px] text-foreground font-medium px-3 rounded-lg hover:bg-secondary transition-colors" onClick={() => setOpen(false)}>Sign In</Link>
                <Link to="/auth" className="flex items-center justify-center min-h-[48px] bg-primary text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity" onClick={() => setOpen(false)}>
                  Register Now
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
