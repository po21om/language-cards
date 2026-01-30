-- migration: create profiles table
-- purpose: user preferences and settings linked to supabase auth
-- affected tables: public.profiles
-- dependencies: auth.users (supabase built-in)

-- create profiles table
-- stores user-specific preferences and settings
-- linked 1:1 with auth.users via foreign key
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  language_preference text not null default 'en' check (language_preference in ('en', 'pl')),
  is_demo_deck_loaded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- enable row level security
-- ensures users can only access their own profile data
alter table public.profiles enable row level security;

-- rls policy: allow users to select their own profile
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- rls policy: allow users to insert their own profile
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

-- rls policy: allow users to update their own profile
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- rls policy: allow users to delete their own profile
create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);
