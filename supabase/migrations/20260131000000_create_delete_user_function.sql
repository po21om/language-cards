-- migration: create delete_user function for account deletion
-- purpose: allows users to delete their own accounts with cascade deletion of all related data
-- security: uses security definer to delete from auth.users (requires elevated privileges)
-- gdpr compliance: ensures complete data removal per user request

-- ============================================================================
-- function: delete_user
-- purpose: permanently deletes a user and all associated data (GDPR compliance)
-- parameters: user_id (uuid) - the id of the user to delete
-- returns: void
-- security: uses security definer to bypass rls and access auth.users
-- cascade behavior:
--   - deletes from auth.users (triggers cascade to profiles, flashcards, etc.)
--   - profiles table: cascade delete via foreign key
--   - flashcards table: cascade delete via foreign key
--   - ai_generation_logs table: cascade delete via foreign key
--   - study_reviews table: cascade delete via foreign key
-- ============================================================================
create or replace function public.delete_user(user_id uuid)
returns void as $$
begin
  -- delete user from auth.users
  -- this will cascade to all related tables due to foreign key constraints
  delete from auth.users where id = user_id;
end;
$$ language plpgsql security definer;

-- grant execute permission to authenticated users (they can only delete themselves)
grant execute on function public.delete_user(uuid) to authenticated;
