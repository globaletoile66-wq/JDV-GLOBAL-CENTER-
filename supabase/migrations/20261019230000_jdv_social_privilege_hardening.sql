-- JDV Social: remove non-application table privileges from API roles.
-- RLS does not protect against TRUNCATE, and these roles do not need to create
-- triggers or foreign-key references on application tables.
-- Candidate only: validate on an isolated Supabase preview before applying remotely.
begin;

revoke truncate, references, trigger on table
  public.social_profiles,
  public.social_posts,
  public.social_reactions,
  public.social_comments,
  public.social_groups,
  public.social_group_memberships,
  public.social_events,
  public.social_event_registrations,
  public.social_external_links,
  public.social_app_preferences,
  public.notifications
from anon, authenticated;

commit;

notify pgrst, 'reload schema';
