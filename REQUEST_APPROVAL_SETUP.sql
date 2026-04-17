-- ============================================================
-- REQUEST APPROVAL SYSTEM
-- Run in Supabase SQL Editor
-- ============================================================

-- Add accepted_by column to requests table
alter table public.requests
  add column if not exists accepted_by uuid references auth.users(id) on delete set null;

-- Update status check to include 'approved' and 'rejected'
-- (status is already text, so no enum change needed)

-- Allow donors to update request status when accepting
drop policy if exists "requests_update_donor_accept" on public.requests;
create policy "requests_update_donor_accept" on public.requests
  for update using (
    -- owner can update, OR any authenticated user can accept (set accepted_by)
    auth.uid() = user_id or auth.uid() is not null
  );

-- Realtime already enabled on requests table from previous setup
-- If not, run:
-- alter publication supabase_realtime add table public.requests;
