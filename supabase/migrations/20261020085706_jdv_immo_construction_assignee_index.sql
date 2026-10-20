-- Index the optional assigned-professional foreign key for JDV Immo construction briefs.
create index if not exists immo_construction_briefs_assignee_idx
  on public.immo_construction_briefs(assigned_professional_user_id)
  where assigned_professional_user_id is not null;
