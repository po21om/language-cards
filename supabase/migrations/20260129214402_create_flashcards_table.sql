-- migration: create flashcards table
-- purpose: core flashcard storage supporting both manual and ai-generated cards
-- affected tables: public.flashcards
-- dependencies: auth.users, public.ai_generation_logs
-- note: this is the central table of the application with comprehensive indexing

-- create flashcards table
-- stores all flashcard data with support for tagging, soft deletes, and study algorithm
-- links to ai_generation_logs for batch tracking (optional foreign key)
create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  front text not null check (length(front) > 0 and length(front) <= 2000),
  back text not null check (length(back) > 0 and length(back) <= 2000),
  tags text[] not null default '{}',
  status text not null default 'review' check (status in ('review', 'active', 'archived')),
  source text not null check (source in ('manual', 'ai')),
  study_weight float not null default 1.0 check (study_weight > 0),
  generation_id uuid references public.ai_generation_logs(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

-- create composite index for study session queries
-- optimizes weighted random selection of active cards for study
create index idx_flashcards_study on public.flashcards(user_id, status, study_weight);

-- create index for dashboard listing
-- optimizes chronological card listing in user interface
create index idx_flashcards_list on public.flashcards(user_id, created_at desc);

-- create gin index for tag-based filtering
-- enables fast array containment queries using @> operator
create index idx_flashcards_tags on public.flashcards using gin(tags);

-- create partial index for soft delete purge operations
-- only indexes deleted cards to optimize scheduled purge job
-- reduces index size by excluding active cards
create index idx_flashcards_deleted on public.flashcards(deleted_at)
  where deleted_at is not null;

-- enable row level security
-- ensures users can only access their own flashcards
alter table public.flashcards enable row level security;

-- rls policy: allow users to select their own flashcards
create policy flashcards_select_own
  on public.flashcards
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow users to insert their own flashcards
create policy flashcards_insert_own
  on public.flashcards
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- rls policy: allow users to update their own flashcards
create policy flashcards_update_own
  on public.flashcards
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- rls policy: allow users to delete their own flashcards
-- note: this enables both hard deletes and soft deletes (setting deleted_at)
create policy flashcards_delete_own
  on public.flashcards
  for delete
  to authenticated
  using (auth.uid() = user_id);
