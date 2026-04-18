/**
 * Central database service — all Supabase calls go through here.
 * Tables: users, requests, matches, donations, notifications
 */
import { supabase as _supabase } from "@/integrations/supabase/client";
import type {
  UserProfile, BloodRequest, Match, Donation, AppNotification,
  UrgencyLevel, MatchStatus, RequestStatus,
} from "@/integrations/supabase/types";

const sb = _supabase as any; // bypass stale generic until schema syncs

export const db = {

  // ── users ────────────────────────────────────────────────────
  users: {
    async getByAuthId(authId: string): Promise<UserProfile | null> {
      const { data, error } = await sb.from("users").select("*").eq("auth_id", authId).single();
      if (error && error.code !== "PGRST116") throw error;
      return data ?? null;
    },

    async update(authId: string, updates: Partial<UserProfile>) {
      const { error } = await sb.from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("auth_id", authId);
      if (error) throw error;
    },

    async setAvailability(authId: string, isAvailable: boolean) {
      const { error } = await sb.from("users")
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq("auth_id", authId);
      if (error) throw error;
    },

    async getAvailableDonors(bloodGroup: string): Promise<UserProfile[]> {
      const { data, error } = await sb.from("users")
        .select("*")
        .eq("blood_group", bloodGroup)
        .eq("is_available", true);
      if (error) throw error;
      return data ?? [];
    },
  },

  // ── requests ─────────────────────────────────────────────────
  requests: {
    async create(payload: {
      user_id: string;
      blood_group: string;
      location?: string;
      latitude?: number | null;
      longitude?: number | null;
      urgency: UrgencyLevel;
      units_needed?: number;
      hospital_name?: string;
      notes?: string;
    }): Promise<BloodRequest> {
      const { data, error } = await sb.from("requests")
        .insert({ ...payload, status: "pending", units_fulfilled: 0 })
        .select().single();
      if (error) throw error;
      return data;
    },

    async listByUser(userId: string): Promise<BloodRequest[]> {
      const { data, error } = await sb.from("requests")
        .select("*").eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async listAll(): Promise<BloodRequest[]> {
      const { data, error } = await sb.from("requests")
        .select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async updateStatus(id: string, status: RequestStatus) {
      const { error } = await sb.from("requests")
        .update({ status, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },

    async delete(id: string) {
      const { error, count } = await sb
        .from("requests")
        .delete({ count: "exact" })
        .eq("id", id);
      if (error) throw error;
      return count;
    },
  },

  // ── matches ──────────────────────────────────────────────────
  matches: {
    async createForRequest(requestId: string, bloodGroup: string): Promise<Match[]> {
      const donors = await db.users.getAvailableDonors(bloodGroup);
      if (!donors.length) return [];
      const rows = donors.map((d) => ({
        request_id: requestId,
        donor_id: d.auth_id,
        status: "pending" as MatchStatus,
      }));
      const { data, error } = await sb.from("matches")
        .upsert(rows, { onConflict: "request_id,donor_id" }).select();
      if (error) throw error;
      return data ?? [];
    },

    async forDonor(authId: string): Promise<any[]> {
      const { data, error } = await sb.from("matches")
        .select("*, request:requests(*)")
        .eq("donor_id", authId)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async updateStatus(matchId: string, status: MatchStatus) {
      const { error } = await sb.from("matches")
        .update({ status, updated_at: new Date().toISOString() }).eq("id", matchId);
      if (error) throw error;
    },

    async accept(matchId: string, requestId: string, donorAuthId: string) {
      await db.matches.updateStatus(matchId, "accepted");
      // Set accepted_by + donor_id so requester can fetch donor details
      const { error } = await sb.from("requests")
        .update({
          status: "accepted",
          accepted_by: donorAuthId,
          donor_id: donorAuthId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      if (error) throw error;
      const { data: req } = await sb.from("requests")
        .select("user_id, blood_group").eq("id", requestId).single();
      if (req) {
        await db.notifications.create({
          user_id: req.user_id,
          title: "🎉 Donor Found!",
          message: `A donor accepted your ${req.blood_group} blood request. View donor details now.`,
          type: "accepted",
          request_id: requestId,
        });
      }
    },

    async acceptWithETA(
      matchId: string,
      requestId: string,
      donorAuthId: string,
      donorLat: number | null,
      donorLon: number | null,
    ) {
      // Fetch request location for ETA
      const { data: req } = await sb.from("requests")
        .select("user_id, blood_group, latitude, longitude, requester_phone")
        .eq("id", requestId).single();

      let etaMinutes: number | null = null;
      let distanceKm: number | null = null;

      if (donorLat && donorLon && req?.latitude && req?.longitude) {
        const { haversine } = await import("@/lib/donorRanking");
        distanceKm = Math.round(haversine(donorLat, donorLon, req.latitude, req.longitude) * 10) / 10;
        etaMinutes = Math.round((distanceKm / 30) * 60); // assume 30 km/h
      }

      await db.matches.updateStatus(matchId, "accepted");

      const { error } = await sb.from("requests")
        .update({
          status: "accepted",
          accepted_by: donorAuthId,
          donor_id: donorAuthId,
          eta_minutes: etaMinutes,
          distance_km: distanceKm,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);
      if (error) throw error;

      if (req) {
        const etaText = etaMinutes ? ` Estimated arrival: ~${etaMinutes} min.` : "";
        await db.notifications.create({
          user_id: req.user_id,
          title: "🎉 Donor is on the way!",
          message: `A donor accepted your ${req.blood_group} request and is heading to you.${etaText}`,
          type: "accepted",
          request_id: requestId,
        });
      }

      return { etaMinutes, distanceKm, requesterPhone: req?.requester_phone ?? null, bloodGroup: req?.blood_group ?? "" };
    },

    async reject(matchId: string) {
      await db.matches.updateStatus(matchId, "rejected");
    },
  },

  // ── donations ────────────────────────────────────────────────
  donations: {
    async complete(requestId: string, donorAuthId: string) {
      const { error: dErr } = await sb.from("donations")
        .insert({ request_id: requestId, donor_id: donorAuthId });
      if (dErr) throw dErr;

      await db.requests.updateStatus(requestId, "fulfilled");

      const { error: mErr } = await sb.from("matches")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("request_id", requestId).eq("donor_id", donorAuthId);
      if (mErr) throw mErr;

      const { error: uErr } = await sb.from("users")
        .update({ last_donated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq("auth_id", donorAuthId);
      if (uErr) throw uErr;
    },
  },

  // ── notifications ─────────────────────────────────────────────
  notifications: {
    async create(payload: {
      user_id: string; title: string; message: string;
      type?: string; request_id?: string;
    }) {
      const { error } = await sb.from("notifications").insert(payload);
      if (error) throw error;
    },

    async list(userId: string): Promise<AppNotification[]> {
      const { data, error } = await sb.from("notifications")
        .select("*").eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },

    async markRead(id: string) {
      const { error } = await sb.from("notifications")
        .update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },

    async markAllRead(userId: string) {
      const { error } = await sb.from("notifications")
        .update({ is_read: true }).eq("user_id", userId);
      if (error) throw error;
    },

    subscribeForUser(userId: string, onNew: (n: AppNotification) => void) {
      return _supabase.channel(`notif:${userId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "notifications",
          filter: `user_id=eq.${userId}`,
        }, (payload: any) => onNew(payload.new as AppNotification))
        .subscribe();
    },
  },
};
