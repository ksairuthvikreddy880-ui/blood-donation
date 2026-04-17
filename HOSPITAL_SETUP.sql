-- ============================================================
-- HOSPITAL ADMIN PANEL — Database Setup
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── hospitals ────────────────────────────────────────────────
create table if not exists public.hospitals (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  address      text,
  city         text,
  phone        text,
  email_domain text not null unique,   -- e.g. "apollo.com"
  created_at   timestamptz not null default now()
);

-- ── hospital_staff ───────────────────────────────────────────
create table if not exists public.hospital_staff (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid not null unique references auth.users(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  role        text not null default 'staff',   -- staff | admin
  created_at  timestamptz not null default now()
);

-- ── blood_inventory ──────────────────────────────────────────
create table if not exists public.blood_inventory (
  id          uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  blood_group text not null,   -- A+, A-, B+, B-, O+, O-, AB+, AB-
  units       integer not null default 0,
  is_available boolean not null default false,
  updated_at  timestamptz not null default now(),
  unique(hospital_id, blood_group)
);

-- ── Seed demo hospitals ──────────────────────────────────────
insert into public.hospitals (name, address, city, phone, email_domain) values
  ('Apollo Hospitals',       'Jubilee Hills, Road No. 72', 'Hyderabad', '040-23607777', 'apollo.com'),
  ('KIMS Hospital',          'Minister Road, Secunderabad', 'Hyderabad', '040-44885000', 'kimshospitals.com'),
  ('Yashoda Hospitals',      'Raj Bhavan Road, Somajiguda', 'Hyderabad', '040-45674567', 'yashodahospitals.com'),
  ('Care Hospitals',         'Road No. 1, Banjara Hills',  'Hyderabad', '040-30418000', 'carehospitals.com'),
  ('Demo Hospital',          '123 Test Street',            'Test City',  '000-0000000',  'demo.com')
on conflict (email_domain) do nothing;

-- ── Seed blood inventory for each hospital ───────────────────
insert into public.blood_inventory (hospital_id, blood_group, units, is_available)
select h.id, bg.blood_group, 0, false
from public.hospitals h
cross join (values ('A+'),('A-'),('B+'),('B-'),('O+'),('O-'),('AB+'),('AB-')) as bg(blood_group)
on conflict (hospital_id, blood_group) do nothing;

-- ── updated_at trigger ───────────────────────────────────────
create or replace function public.set_inventory_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_inventory_updated_at on public.blood_inventory;
create trigger trg_inventory_updated_at
  before update on public.blood_inventory
  for each row execute function public.set_inventory_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
alter table public.hospitals       enable row level security;
alter table public.hospital_staff  enable row level security;
alter table public.blood_inventory enable row level security;

-- hospitals: anyone can read (shown on main site)
drop policy if exists "hospitals_read_all" on public.hospitals;
create policy "hospitals_read_all" on public.hospitals for select using (true);

-- hospital_staff: own record only
drop policy if exists "staff_read_own"   on public.hospital_staff;
drop policy if exists "staff_insert_own" on public.hospital_staff;
create policy "staff_read_own"   on public.hospital_staff for select using (auth.uid() = auth_id);
create policy "staff_insert_own" on public.hospital_staff for insert with check (auth.uid() = auth_id);

-- blood_inventory: anyone can read, only staff of that hospital can update
drop policy if exists "inventory_read_all"    on public.blood_inventory;
drop policy if exists "inventory_update_staff" on public.blood_inventory;
create policy "inventory_read_all" on public.blood_inventory for select using (true);
create policy "inventory_update_staff" on public.blood_inventory for update
  using (
    hospital_id in (
      select hospital_id from public.hospital_staff where auth_id = auth.uid()
    )
  );
