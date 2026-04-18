import { Heart, Menu, X, LayoutDashboard, Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/db";
import type { AppNotification } from "@/integrations/supabase/types";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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

  // Load notifications
  useEffect(() => {
    if (!user) return;
    
    const loadNotifications = async () => {
      try {
        const notifs = await db.notifications.list(user.id);
        // Show only top 5 most recent
        setNotifications(notifs.slice(0, 5));
        setUnreadCount(notifs.filter(n => !n.read).length);
      } catch (error) {
        console.error("Failed to load notifications:", error);
      }
    };

    loadNotifications();

    // Subscribe to new notifications
    const channel = db.notifications.subscribeForUser(user.id, (newNotif) => {
      setNotifications(prev => [newNotif, ...prev].slice(0, 5));
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user]);

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

  const handleNotificationClick = async (notif: AppNotification) => {
    // Mark as read
    if (!notif.read) {
      await db.notifications.markRead(notif.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    }
    
    // Navigate to relevant page
    if (notif.request_id) {
      navigate(`/request/${notif.request_id}`);
    } else {
      navigate('/dashboard');
    }
    setNotifOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match': return '🩸';
      case 'accepted': return '🎉';
      case 'completed': return '✅';
      default: return '🔔';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

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
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className={`relative p-2 rounded-lg hover:bg-secondary transition-colors ${textCls}`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {notifOpen && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setNotifOpen(false)}
                      />
                      
                      {/* Dropdown */}
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
                      >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-border bg-muted/30">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">Notifications</h3>
                            {unreadCount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {unreadCount} unread
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <button
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 ${
                                  !notif.read ? 'bg-primary/5' : ''
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl flex-shrink-0">
                                    {getNotificationIcon(notif.type)}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-foreground mb-1">
                                      {notif.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {notif.message}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {formatTimeAgo(notif.created_at)}
                                    </p>
                                  </div>
                                  {!notif.read && (
                                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1" />
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="px-4 py-2 border-t border-border bg-muted/30">
                            <Link
                              to="/dashboard"
                              onClick={() => setNotifOpen(false)}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              View all notifications →
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

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
