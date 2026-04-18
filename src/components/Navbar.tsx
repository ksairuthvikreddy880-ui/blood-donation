import { Heart, Menu, X, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only the home page gets the transparent + white-text treatment
  const isHome = location.pathname === "/";

  // Track scroll position on home page
  useEffect(() => {
    if (!isHome) { setScrolled(false); return; }
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // White text when: on home AND not scrolled past hero
  const isLight = isHome && !scrolled;

  const scrollTo = (id: string) => {
    setOpen(false);
    if (!isHome) {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 100);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const textCls = `transition-colors duration-300 ${isLight ? "text-white" : "text-foreground"}`;
  const mutedCls = `transition-colors duration-300 ${isLight ? "text-white/90" : "text-muted-foreground"}`;
  const hoverCls = "hover:text-primary";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-40 backdrop-blur-xl border-b transition-all duration-300 ${
      isLight
        ? "bg-background/10 border-white/10"
        : "bg-background/90 border-border/50"
    }`}>
      <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" fill="currentColor" />
          </div>
          <span className={`font-display text-lg font-bold ${textCls}`}>
            Instant Blood Connect
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className={`hidden md:flex items-center gap-8 text-sm font-medium ${mutedCls}`}>
          <button onClick={() => scrollTo("how")} className={`${hoverCls} transition-colors duration-300`}>How It Works</button>
          <button onClick={() => scrollTo("trust")} className={`${hoverCls} transition-colors duration-300`}>Why Trust Us</button>
          <button onClick={() => scrollTo("stats")} className={`${hoverCls} transition-colors duration-300`}>Impact</button>
          {user && (
            <Link to="/blood-exchange" className={`${hoverCls} transition-colors duration-300`}>Blood Exchange</Link>
          )}
        </div>

        {/* Desktop right actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              <Link to="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${textCls} ${hoverCls}`}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link to="/profile"
                className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white font-display font-bold text-sm hover:opacity-90 transition-opacity ring-2 ring-primary/20"
                title="My Profile">
                {profile?.full_name
                  ? profile.full_name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
                  : user.email?.[0]?.toUpperCase() ?? "?"}
              </Link>
            </>
          ) : (
            <>
              <Link to="/auth" className={`px-4 py-2 text-sm font-medium ${textCls} ${hoverCls}`}>
                Sign In
              </Link>
              <Link to="/auth" className="px-5 py-2.5 text-sm font-semibold bg-primary text-white rounded-xl hover:opacity-90 transition-opacity">
                Register Now
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button onClick={() => setOpen(!open)} className={`md:hidden ${textCls}`}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-background/95 border-b border-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <button onClick={() => scrollTo("how")} className="block w-full text-left text-foreground font-medium">How It Works</button>
              <button onClick={() => scrollTo("trust")} className="block w-full text-left text-foreground font-medium">Why Trust Us</button>
              <button onClick={() => scrollTo("stats")} className="block w-full text-left text-foreground font-medium">Impact</button>
              {user && (
                <Link to="/blood-exchange" className="block text-foreground font-medium" onClick={() => setOpen(false)}>Blood Exchange</Link>
              )}
              <hr className="border-border" />
              {user ? (
                <>
                  <Link to="/dashboard" className="block text-foreground font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
                  <button onClick={() => { setOpen(false); handleSignOut(); }} className="block w-full text-left text-foreground font-medium">Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/auth" className="block text-foreground font-medium" onClick={() => setOpen(false)}>Sign In</Link>
                  <Link to="/auth" className="block w-full text-center py-3 bg-primary text-white rounded-xl font-semibold" onClick={() => setOpen(false)}>Register Now</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
