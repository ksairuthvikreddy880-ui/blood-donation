-- Add requester_phone to requests so donor can contact without extra lookup
alter table public.requests
  add column if not exists requester_phone text,
  add column if not exists patient_name    text;
