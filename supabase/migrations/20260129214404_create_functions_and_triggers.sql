-- migration: create database functions and triggers
-- purpose: automated timestamp maintenance, demo deck initialization, and soft delete purge
-- affected tables: public.profiles, public.flashcards
-- dependencies: all previous table migrations

-- ============================================================================
-- function: update_updated_at_column
-- purpose: automatically updates the updated_at timestamp on row modification
-- usage: attached to tables via before update triggers
-- ============================================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- trigger: update profiles updated_at timestamp
-- automatically maintains updated_at column on profile modifications
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at_column();

-- trigger: update flashcards updated_at timestamp
-- automatically maintains updated_at column on flashcard modifications
create trigger update_flashcards_updated_at
  before update on public.flashcards
  for each row
  execute function public.update_updated_at_column();

-- ============================================================================
-- function: create_demo_deck_for_new_user
-- purpose: automatically creates profile and demo flashcards for new users
-- security: uses security definer to bypass rls during initialization
-- note: this function runs automatically when a new user signs up
-- ============================================================================
create or replace function public.create_demo_deck_for_new_user()
returns trigger as $$
begin
  -- create profile for new user with demo deck flag set
  insert into public.profiles (id, language_preference, is_demo_deck_loaded)
  values (new.id, 'en', true);
  
  -- insert demo flashcards to help user understand the application
  -- these cards explain key concepts: spaced repetition, flashcards, and ai generation
  insert into public.flashcards (user_id, front, back, tags, status, source, study_weight)
  values
    (new.id, 'What is spaced repetition?', 'A learning technique that involves reviewing information at increasing intervals to improve long-term retention.', array['📚', 'learning'], 'active', 'manual', 1.0),
    (new.id, 'How do flashcards help learning?', 'They promote active recall, which strengthens memory connections and improves retention.', array['📚', 'memory'], 'active', 'manual', 1.0),
    (new.id, 'What is the benefit of AI-generated flashcards?', 'They save time by automatically creating high-quality study materials from text.', array['🤖', 'ai'], 'active', 'manual', 1.0);
  
  return new;
end;
$$ language plpgsql security definer;

-- trigger: create demo deck on user signup
-- automatically initializes new user with profile and demo flashcards
-- runs after user record is created in auth.users table
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.create_demo_deck_for_new_user();

-- ============================================================================
-- function: purge_old_deleted_flashcards
-- purpose: permanently deletes flashcards soft-deleted more than 30 days ago
-- returns: count of deleted records
-- security: uses security definer to bypass rls for maintenance operations
-- note: should be scheduled to run daily via pg_cron or edge function
-- ============================================================================
create or replace function public.purge_old_deleted_flashcards()
returns integer as $$
declare
  deleted_count integer;
begin
  -- permanently delete flashcards that have been soft-deleted for over 30 days
  -- this provides a recovery window while ensuring eventual cleanup
  delete from public.flashcards
  where deleted_at is not null
    and deleted_at < now() - interval '30 days';
  
  -- capture the number of rows deleted for logging/monitoring
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$ language plpgsql security definer;
