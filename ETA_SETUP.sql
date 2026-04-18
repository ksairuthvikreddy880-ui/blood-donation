-- Add ETA and distance columns to requests
alter table public.requests
  add column if not exists eta_minutes  integer,
  add column if not exists distance_km  numeric(6,2),
  add column if not exists donor_id     uuid references auth.users(id) on delete set null;
