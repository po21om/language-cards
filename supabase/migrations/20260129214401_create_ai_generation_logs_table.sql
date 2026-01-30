-- migration: create ai_generation_logs table
-- purpose: tracks ai generation requests and acceptance metrics
-- affected tables: public.ai_generation_logs
-- dependencies: auth.users (supabase built-in)

-- create ai_generation_logs table
-- stores metrics for each ai generation batch request
-- tracks user acceptance/rejection/refinement rates for analytics
create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_length integer not null check (input_length > 0 and input_length <= 1800),
  cards_generated integer not null check (cards_generated >= 0),
  cards_accepted integer not null default 0 check (cards_accepted >= 0 and cards_accepted <= cards_generated),
  cards_rejected integer not null default 0 check (cards_rejected >= 0),
  cards_refined integer not null default 0 check (cards_refined >= 0),
  timestamp timestamptz not null default now()
);

-- create index for analytics queries
-- optimizes user-specific analytics queries ordered by time
create index idx_ai_logs_user_time on public.ai_generation_logs(user_id, timestamp desc);

-- enable row level security
-- ensures users can only access their own generation logs
alter table public.ai_generation_logs enable row level security;

-- rls policy: allow users to select their own generation logs
create policy ai_logs_select_own
  on public.ai_generation_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow users to insert their own generation logs
create policy ai_logs_insert_own
  on public.ai_generation_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow users to update their own generation logs
-- needed for updating acceptance metrics after user reviews cards
create policy ai_logs_update_own
  on public.ai_generation_logs
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
