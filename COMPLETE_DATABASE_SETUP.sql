-- ============================================================
-- INSTANT BLOOD CONNECT — Complete Database Setup
-- Run this entire file in Supabase SQL Editor
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
create type public.user_role         as enum ('donor', 'requester', 'admin');
create type public.availability_status as enum ('available', 'unavailable', 'available_soon');
create type public.request_status    as enum ('pending', 'accepted', 'fulfilled', 'cancelled', 'expired');
create type public.urgency_level     as enum ('normal', 'urgent', 'critical');
create type public.match_status      as enum ('pending', 'accepted', 'rejected', 'completed');

-- ── profiles ─────────────────────────────────────────────────
create table public.profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references auth.users(id) on delete cascade,
  full_name         text not null default '',
  phone             text,
  blood_group       text,
  city              text,
  latitude          double precision,
  longitude         double precision,
  role              public.user_role not null default 'donor',
  availability      public.availability_status not null default 'available',
  is_available      boolean not null default true,
  verified          boolean not null default false,
  blood_credits     integer not null default 0,
  last_donated_at   timestamptz,
  avatar_url        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ── requests ─────────────────────────────────────────────────
create table public.requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  blood_group   text not null,
  location      text,
  latitude      double precision,
  longitude     double precision,
  urgency       public.urgency_level not null default 'normal',
  status        public.request_status not null default 'pending',
  units_needed  integer not null default 1,
  units_fulfilled integer not null default 0,
  hospital_name text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── matches ──────────────────────────────────────────────────
create table public.matches (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid not null references public.requests(id) on delete cascade,
  donor_id    uuid not null references auth.users(id) on delete cascade,
  status      public.match_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique(request_id, donor_id)
);

-- ── donations ────────────────────────────────────────────────
create table public.donations (
  id          uuid primary key default gen_random_uuid(),
  request_id  uuid references public.requests(id) on delete set null,
  donor_id    uuid not null references auth.users(id) on delete cascade,
  donated_at  timestamptz not null default now(),
  notes       text
);

-- ── notifications ────────────────────────────────────────────
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  message     text not null,
  type        text not null default 'info',   -- info | match | accepted | completed
  read        boolean not null default false,
  request_id  uuid references public.requests(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- ── updated_at triggers ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated_at   before update on public.profiles    for each row execute function public.set_updated_at();
create trigger trg_requests_updated_at   before update on public.requests    for each row execute function public.set_updated_at();
create trigger trg_matches_updated_at    before update on public.matches     for each row execute function public.set_updated_at();

-- ── auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', null),
    'donor'
  );
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ───────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.requests      enable row level security;
alter table public.matches       enable row level security;
alter table public.donations     enable row level security;
alter table public.notifications enable row level security;

-- profiles: users can read all, edit own
create policy "profiles_select_all"  on public.profiles for select using (true);
create policy "profiles_insert_own"  on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles_update_own"  on public.profiles for update using (auth.uid() = user_id);

-- requests: anyone can read, owner can insert/update
create policy "requests_select_all"  on public.requests for select using (true);
create policy "requests_insert_auth" on public.requests for insert with check (auth.uid() = user_id);
create policy "requests_update_own"  on public.requests for update using (auth.uid() = user_id);

-- matches: donor or requester can see their own
create policy "matches_select" on public.matches for select
  using (
    auth.uid() = donor_id or
    auth.uid() = (select user_id from public.requests where id = request_id)
  );
create policy "matches_insert_auth" on public.matches for insert with check (auth.uid() is not null);
create policy "matches_update_donor" on public.matches for update using (auth.uid() = donor_id);

-- donations: donor can insert/read own
create policy "donations_select_own" on public.donations for select using (auth.uid() = donor_id);
create policy "donations_insert_own" on public.donations for insert with check (auth.uid() = donor_id);

-- notifications: user can read/update own
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);
create policy "notifications_insert_auth" on public.notifications for insert with check (auth.uid() is not null);

-- ── Realtime ─────────────────────────────────────────────────
alter publication supabase_realtime add table public.requests;
alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.notifications;
