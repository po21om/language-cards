-- migration: create study_reviews table
-- purpose: historical record of study session interactions
-- affected tables: public.study_reviews
-- dependencies: auth.users, public.flashcards
-- note: high-volume table for analytics and algorithm tracking

-- create study_reviews table
-- stores complete audit trail of all study interactions
-- tracks weight changes for algorithm analysis
create table public.study_reviews (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.flashcards(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  outcome text not null check (outcome in ('correct', 'incorrect', 'skipped')),
  previous_weight float not null check (previous_weight > 0),
  new_weight float not null check (new_weight > 0),
  reviewed_at timestamptz not null default now()
);

-- create index for card history queries
-- optimizes retrieval of review history for individual cards
create index idx_study_reviews_card on public.study_reviews(card_id, reviewed_at desc);

-- create index for user analytics queries
-- optimizes user-specific study statistics and progress tracking
create index idx_study_reviews_user on public.study_reviews(user_id, reviewed_at desc);

-- enable row level security
-- ensures users can only access their own study reviews
alter table public.study_reviews enable row level security;

-- rls policy: allow users to select their own study reviews
create policy study_reviews_select_own
  on public.study_reviews
  for select
  to authenticated
  using (auth.uid() = user_id);

-- rls policy: allow users to insert their own study reviews
create policy study_reviews_insert_own
  on public.study_reviews
  for insert
  to authenticated
  with check (auth.uid() = user_id);
