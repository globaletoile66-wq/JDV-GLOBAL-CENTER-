-- APPLIQUÉ en production le 2026-10-11. Testé : l'utilisateur voit uniquement ses sessions (2 sur 3 créées pour le test),
-- la session courante ne peut pas être fermée par la fonction (déconnexion normale), la session d'un autre est introuvable
-- et intacte, un visiteur est refusé.
create or replace function public.account_list_sessions()
returns table(id uuid, created_at timestamptz, last_seen_at timestamptz, user_agent text, ip text, aal text, is_current boolean)
language sql stable security definer set search_path = public, auth, pg_catalog as $$
  select s.id,
         s.created_at,
         coalesce(s.refreshed_at::timestamptz, s.updated_at, s.created_at) as last_seen_at,
         s.user_agent,
         host(s.ip),
         s.aal::text,
         s.id::text = coalesce(auth.jwt() ->> 'session_id', '')
  from auth.sessions s
  where s.user_id = auth.uid()
    and (s.not_after is null or s.not_after > now())
  order by 3 desc nulls last;
$$;

create or replace function public.account_revoke_session(p_session_id uuid)
returns void language plpgsql security definer set search_path = public, auth, pg_catalog as $$
begin
  if auth.uid() is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if p_session_id::text = coalesce(auth.jwt() ->> 'session_id', '') then
    raise exception 'CURRENT_SESSION_USE_SIGNOUT';
  end if;
  delete from auth.sessions where id = p_session_id and user_id = auth.uid();
  if not found then raise exception 'SESSION_NOT_FOUND'; end if;
  insert into public.audit_logs(user_id, module_code, action, entity_type, entity_id)
  values (auth.uid(), 'jdv_core', 'session.revoked', 'auth.sessions', p_session_id::text);
end $$;

revoke all on function public.account_list_sessions() from public, anon;
revoke all on function public.account_revoke_session(uuid) from public, anon;
grant execute on function public.account_list_sessions() to authenticated;
grant execute on function public.account_revoke_session(uuid) to authenticated;
