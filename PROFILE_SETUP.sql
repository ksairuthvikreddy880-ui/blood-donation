-- ============================================================
-- PROFILE TABLE SETUP
-- Run this in Supabase SQL Editor
-- ============================================================

-- Ensure users table has all profile columns
alter table public.users
  add column if not exists full_name    text not null default '',
  add column if not exists phone        text,
  add column if not exists blood_group  text,
  add column if not exists city         text,
  add column if not exists role         text not null default 'donor',
  add column if not exists is_available boolean not null default true,
  add column if not exists verified     boolean not null default false,
  add column if not exists blood_credits integer not null default 0,
  add column if not exists last_donated_at timestamptz,
  add column if not exists avatar_url   text,
  add column if not exists auth_id      uuid unique references auth.users(id) on delete cascade,
  add column if not exists created_at   timestamptz not null default now(),
  add column if not exists updated_at   timestamptz not null default now();

-- Fix requests FK to point to auth.users directly
alter table public.requests
  drop constraint if exists requests_user_id_fkey;
alter table public.requests
  add constraint requests_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete cascade;

-- Auto-create user row on signup
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

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- RLS
alter table public.users enable row level security;
drop policy if exists "users_select_all" on public.users;
drop policy if exists "users_insert_own" on public.users;
drop policy if exists "users_update_own" on public.users;
create policy "users_select_all" on public.users for select using (true);
create policy "users_insert_own" on public.users for insert with check (auth.uid() = auth_id);
create policy "users_update_own" on public.users for update using (auth.uid() = auth_id);
