-- ============================================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── users table: ensure all columns exist ────────────────────
alter table public.users
  add column if not exists auth_id uuid unique references auth.users(id) on delete cascade,
  add column if not exists is_available boolean not null default true,
  add column if not exists city text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists last_donated_at timestamptz,
  add column if not exists blood_credits integer not null default 0,
  add column if not exists verified boolean not null default false,
  add column if not exists avatar_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ── requests table: ensure all columns exist ─────────────────
alter table public.requests
  add column if not exists status text not null default 'pending',
  add column if not exists units_needed integer not null default 1,
  add column if not exists units_fulfilled integer not null default 0,
  add column if not exists hospital_name text,
  add column if not exists notes text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ── matches table: ensure all columns exist ──────────────────
alter table public.matches
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- ── notifications table: ensure all columns exist ────────────
alter table public.notifications
  add column if not exists title text not null default '',
  add column if not exists is_read boolean not null default false,
  add column if not exists request_id uuid references public.requests(id) on delete set null,
  add column if not exists created_at timestamptz not null default now();

-- ── donations table: ensure all columns exist ────────────────
alter table public.donations
  add column if not exists notes text,
  add column if not exists created_at timestamptz not null default now();

-- ── updated_at auto-trigger ───────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists trg_requests_updated_at on public.requests;
create trigger trg_requests_updated_at
  before update on public.requests
  for each row execute function public.set_updated_at();

drop trigger if exists trg_matches_updated_at on public.matches;
create trigger trg_matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

-- ── auto-insert into users on signup ─────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (auth_id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    coalesce(new.raw_user_meta_data->>'role', 'donor')
  )
  on conflict (auth_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── RLS policies ─────────────────────────────────────────────
alter table public.users          enable row level security;
alter table public.requests       enable row level security;
alter table public.matches        enable row level security;
alter table public.donations      enable row level security;
alter table public.notifications  enable row level security;

-- users: anyone can read, owner can edit
drop policy if exists "users_select_all"  on public.users;
drop policy if exists "users_insert_own"  on public.users;
drop policy if exists "users_update_own"  on public.users;
create policy "users_select_all"  on public.users for select using (true);
create policy "users_insert_own"  on public.users for insert with check (auth.uid() = auth_id);
create policy "users_update_own"  on public.users for update using (auth.uid() = auth_id);

-- requests: anyone can read, owner can insert/update
drop policy if exists "requests_select_all"  on public.requests;
drop policy if exists "requests_insert_auth" on public.requests;
drop policy if exists "requests_update_own"  on public.requests;
create policy "requests_select_all"  on public.requests for select using (true);
create policy "requests_insert_auth" on public.requests for insert with check (auth.uid() = user_id);
create policy "requests_update_own"  on public.requests for update using (auth.uid() = user_id);

-- matches: donor or requester can see
drop policy if exists "matches_select"       on public.matches;
drop policy if exists "matches_insert_auth"  on public.matches;
drop policy if exists "matches_update_donor" on public.matches;
create policy "matches_select" on public.matches for select
  using (
    auth.uid() = donor_id or
    auth.uid() = (select user_id from public.requests where id = request_id)
  );
create policy "matches_insert_auth"  on public.matches for insert with check (auth.uid() is not null);
create policy "matches_update_donor" on public.matches for update using (auth.uid() = donor_id);

-- donations
drop policy if exists "donations_select_own" on public.donations;
drop policy if exists "donations_insert_own" on public.donations;
create policy "donations_select_own" on public.donations for select using (auth.uid() = donor_id);
create policy "donations_insert_own" on public.donations for insert with check (auth.uid() = donor_id);

-- notifications
drop policy if exists "notifications_select_own"  on public.notifications;
drop policy if exists "notifications_update_own"  on public.notifications;
drop policy if exists "notifications_insert_auth" on public.notifications;
create policy "notifications_select_own"  on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own"  on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_insert_auth" on public.notifications for insert with check (auth.uid() is not null);

-- ── Realtime (skip if already added) ────────────────────────
do $$ begin
  alter publication supabase_realtime add table public.requests;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.matches;
exception when others then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when others then null; end $$;
