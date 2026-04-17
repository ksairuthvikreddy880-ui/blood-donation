export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'donor' | 'requester' | 'admin';
export type RequestStatus = 'pending' | 'accepted' | 'fulfilled' | 'cancelled' | 'expired';
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';
export type MatchStatus = 'pending' | 'accepted' | 'rejected' | 'completed';

// Matches public.users table
export interface UserProfile {
  id: string;           // uuid PK (not auth.uid — use auth_id for that)
  auth_id: string;      // references auth.users.id
  full_name: string;
  phone: string | null;
  role: UserRole;
  blood_group: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_available: boolean;
  verified: boolean;
  blood_credits: number;
  last_donated_at: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Matches public.requests table
export interface BloodRequest {
  id: string;
  user_id: string;       // auth.uid of requester
  blood_group: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  urgency: UrgencyLevel;
  status: RequestStatus;
  units_needed: number;
  units_fulfilled: number;
  hospital_name: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Matches public.matches table
export interface Match {
  id: string;
  request_id: string;
  donor_id: string;      // auth.uid of donor
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

// Matches public.donations table
export interface Donation {
  id: string;
  donor_id: string;
  request_id: string | null;
  donated_at: string;
  notes: string | null;
  created_at: string;
}

// Matches public.notifications table
export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  request_id: string | null;
  created_at: string;
}

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.1" };
  public: {
    Tables: {
      users: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { auth_id: string };
        Update: Partial<UserProfile>;
        Relationships: [];
      };
      requests: {
        Row: BloodRequest;
        Insert: Omit<BloodRequest, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<BloodRequest>;
        Relationships: [];
      };
      matches: {
        Row: Match;
        Insert: Omit<Match, 'id' | 'created_at' | 'updated_at'> & { id?: string };
        Update: Partial<Match>;
        Relationships: [];
      };
      donations: {
        Row: Donation;
        Insert: Omit<Donation, 'id' | 'donated_at' | 'created_at'> & { id?: string };
        Update: Partial<Donation>;
        Relationships: [];
      };
      notifications: {
        Row: AppNotification;
        Insert: Omit<AppNotification, 'id' | 'created_at' | 'is_read'> & { id?: string };
        Update: Partial<AppNotification>;
        Relationships: [];
      };
    };
    Enums: {
      user_role: UserRole;
      request_status: RequestStatus;
      urgency_level: UrgencyLevel;
      match_status: MatchStatus;
    };
  };
};
