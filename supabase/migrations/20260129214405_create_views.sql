-- migration: create database views
-- purpose: simplified view for data export functionality
-- affected tables: public.view_flashcards_export
-- dependencies: public.flashcards

-- ============================================================================
-- view: view_flashcards_export
-- purpose: simplified view for csv/json export functionality
-- filters: only active cards, excludes soft-deleted cards
-- security: uses security_invoker to respect rls policies
-- ============================================================================
create or replace view public.view_flashcards_export as
select
  f.id,
  f.user_id,
  f.front,
  f.back,
  f.tags,
  f.source,
  f.created_at,
  f.updated_at
from public.flashcards f
where f.status = 'active'
  and f.deleted_at is null;

-- enable rls on view using security_invoker mode
-- this ensures the view respects the rls policies of the underlying flashcards table
-- users will only see their own cards through this view
alter view public.view_flashcards_export set (security_invoker = true);
