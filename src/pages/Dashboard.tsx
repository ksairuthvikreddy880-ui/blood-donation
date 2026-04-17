import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, User, MapPin, Droplets, LogOut, Clock, Edit, Activity,
  Save, X, Search, Bell, Loader2, CheckCircle, XCircle, ToggleLeft, ToggleRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/db";
import { supabase } from "@/integrations/supabase/client";
import type { BloodRequest, Match, AppNotification, UserProfile } from "@/integrations/supabase/types";
import RequestBloodModal from "@/components/RequestBloodModal";
import MyRequestsSection from "@/components/MyRequestsSection";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function Dashboard() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [myRequests, setMyRequests] = useState<BloodRequest[]>([]);
  const [myMatches, setMyMatches] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [localAvail, setLocalAvail] = useState<boolean | null>(null);

  // Sync local state when profile loads
  useEffect(() => {
    if (profile !== null) setLocalAvail(profile.is_available);
  }, [profile?.is_available]);
  const [editForm, setEditForm] = useState({
    full_name: "", phone: "", city: "", blood_group: "",
  });

  useEffect(() => {
    if (!user) return;
    loadAll();

    // Realtime: new notifications
    const channel = db.notifications.subscribeForUser(user.id, (n) => {
      setNotifications((prev) => [n, ...prev]);
      toast({ title: n.title, description: n.message });
    });

    // Realtime: request status changes
    const reqChannel = supabase.channel("req-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requests" },
        () => loadMyRequests())
      .subscribe();

    return () => {
      supabase.removeChannel(channel as any);
      supabase.removeChannel(reqChannel);
    };
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadMyRequests(), loadMyMatches(), loadNotifications()]);
    setLoading(false);
  };

  const loadMyRequests = async () => {
    if (!user) return;
    const data = await db.requests.listByUser(user.id);
    setMyRequests(data);
  };

  const loadMyMatches = async () => {
    if (!user) return;
    const data = await db.matches.forDonor(user.id);
    setMyMatches(data);
  };

  const loadNotifications = async () => {
    if (!user) return;
    const data = await db.notifications.list(user.id);
    setNotifications(data);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      await db.users.update(user.id, {
        full_name: editForm.full_name,
        phone: editForm.phone || null,
        city: editForm.city || null,
        blood_group: editForm.blood_group || null,
      });
      await refreshProfile();
      setIsEditOpen(false);
      toast({ title: "Profile updated!" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setSavingProfile(false); }
  };

  const handleToggleAvailability = async () => {
    if (!user) return;
    const newVal = !(localAvail ?? profile?.is_available ?? false);
    setLocalAvail(newVal); // instant UI update
    setTogglingAvail(true);
    try {
      await db.users.setAvailability(user.id, newVal);
      await refreshProfile();
      toast({ title: `You are now ${newVal ? "available" : "unavailable"} for donations` });
    } catch (err: any) {
      setLocalAvail(!newVal); // revert on error
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally { setTogglingAvail(false); }
  };

  const handleAcceptMatch = async (match: any) => {
    try {
      await db.matches.accept(match.id, match.request_id, user!.id);
      toast({ title: "Match accepted!", description: "The requester has been notified." });
      loadMyMatches();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRejectMatch = async (matchId: string) => {
    try {
      await db.matches.reject(matchId);
      toast({ title: "Match declined" });
      loadMyMatches();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCompleteDonation = async (requestId: string) => {
    try {
      await db.donations.complete(requestId, user!.id);
      toast({ title: "Donation recorded! Thank you ❤️" });
      loadAll();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteRequest = async (id: string) => {
    // Optimistic UI update
    setMyRequests(prev => prev.filter(r => r.id !== id));
    try {
      await db.requests.delete(id);
      toast({ title: "Request deleted" });
    } catch (err: any) {
      // Revert on failure
      loadMyRequests();
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await db.notifications.markAllRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const openEdit = () => {
    setEditForm({
      full_name: profile?.full_name ?? "",
      phone: profile?.phone ?? "",
      city: profile?.city ?? "",
      blood_group: profile?.blood_group ?? "",
    });
    setIsEditOpen(true);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="loader"><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/><div className="loader-square"/></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/50">
        <div className="container max-w-6xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">Dashboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAvailability}
              disabled={togglingAvail}
              className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                localAvail
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {localAvail
                ? <ToggleRight className="w-4 h-4" />
                : <ToggleLeft className="w-4 h-4" />}
              {localAvail ? "Available" : "Unavailable"}
            </button>
            <button
              onClick={() => { signOut(); navigate("/"); }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="container max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Welcome, {profile?.full_name || "User"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {profile?.blood_group ? `Blood Group: ${profile.blood_group}` : "Complete your profile to get started"}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsRequestOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Droplets className="w-4 h-4" /> Request Blood
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Blood Group", value: profile?.blood_group ?? "—", icon: Droplets },
            { label: "My Requests", value: myRequests.length, icon: Activity },
            { label: "Matches", value: myMatches.length, icon: Search },
            { label: "Notifications", value: unreadCount, icon: Bell },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-soft">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/find-donors">
            <div className="bg-primary text-primary-foreground rounded-xl p-5 text-left hover:opacity-90 transition-opacity h-full cursor-pointer">
              <Search className="w-6 h-6 mb-2" />
              <p className="font-display font-semibold">Find Donors</p>
              <p className="text-sm opacity-80 mt-1">AI-ranked donor search</p>
            </div>
          </Link>
          <button onClick={() => setIsRequestOpen(true)}
            className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-soft transition-shadow">
            <Droplets className="w-6 h-6 mb-2 text-primary" />
            <p className="font-display font-semibold text-foreground">Request Blood</p>
            <p className="text-sm text-muted-foreground mt-1">Create an emergency request</p>
          </button>
          <Link to="/donate-blood">
            <div className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-soft transition-shadow h-full cursor-pointer">
              <Heart className="w-6 h-6 mb-2 text-primary" />
              <p className="font-display font-semibold text-foreground">Donate Blood</p>
              <p className="text-sm text-muted-foreground mt-1">See requests near you</p>
            </div>
          </Link>
          <Link to="/blood-centres">
            <div className="bg-card border border-border rounded-xl p-5 text-left hover:shadow-soft transition-shadow h-full cursor-pointer">
              <MapPin className="w-6 h-6 mb-2 text-primary" />
              <p className="font-display font-semibold text-foreground">View Blood Groups</p>
              <p className="text-sm text-muted-foreground mt-1">Available blood at nearby centres</p>
            </div>
          </Link>
        </div>

        {/* Incoming Matches (donor view) */}
        {myMatches.length > 0 && (
          <section>
            <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Incoming Requests for You
              <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">{myMatches.length}</span>
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {myMatches.map((match) => (
                <motion.div key={match.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card border border-border rounded-2xl p-5 shadow-soft">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                        match.request?.urgency === "critical" ? "bg-red-100 text-red-700" :
                        match.request?.urgency === "urgent" ? "bg-orange-100 text-orange-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>{match.request?.urgency?.toUpperCase()}</span>
                      <p className="font-display font-bold text-2xl text-primary mt-1">{match.request?.blood_group}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      match.status === "accepted" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{match.status}</span>
                  </div>
                  {match.request?.location && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3" /> {match.request.location}
                    </p>
                  )}
                  {match.request?.hospital_name && (
                    <p className="text-sm text-muted-foreground mb-3">🏥 {match.request.hospital_name}</p>
                  )}
                  {match.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => handleAcceptMatch(match)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-500 transition-colors">
                        <CheckCircle className="w-4 h-4" /> Accept
                      </button>
                      <button onClick={() => handleRejectMatch(match.id)}
                        className="flex-1 flex items-center justify-center gap-1 py-2 border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-secondary transition-colors">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  )}
                  {match.status === "accepted" && (
                    <button onClick={() => handleCompleteDonation(match.request_id)}
                      className="w-full mt-3 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                      ✅ Mark Donation Complete
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* My Requests */}
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> My Blood Requests
          </h2>
          <MyRequestsSection
            userId={user?.id ?? ""}
            onDelete={handleDeleteRequest}
          />
        </section>

        {/* Notifications */}
        {notifications.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" /> Notifications
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">{unreadCount}</span>
                )}
              </h2>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
              )}
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 10).map((n) => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                  n.is_read ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                }`}>
                  <div className="w-2 h-2 rounded-full mt-2 flex-shrink-0 bg-primary" style={{ opacity: n.is_read ? 0.3 : 1 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => db.notifications.markRead(n.id).then(() =>
                      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x))
                    )} className="text-xs text-primary hover:underline flex-shrink-0">Read</button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-elevated">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold text-foreground">Edit Profile</h2>
                <button onClick={() => setIsEditOpen(false)} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {[
                  { label: "Full Name", key: "full_name", type: "text" },
                  { label: "Phone", key: "phone", type: "tel" },
                  { label: "City", key: "city", type: "text" },
                ].map(({ label, key, type }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                    <input type={type} value={(editForm as any)[key]}
                      onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Blood Group</label>
                  <select value={editForm.blood_group}
                    onChange={(e) => setEditForm({ ...editForm, blood_group: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm">
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditOpen(false)}
                    className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
                  <button type="submit" disabled={savingProfile}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                    {savingProfile && <Loader2 className="w-4 h-4 animate-spin" />} Save
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <RequestBloodModal isOpen={isRequestOpen} onClose={() => { setIsRequestOpen(false); loadMyRequests(); }} />
    </div>
  );
}
