-- Explicitly block anonymous execution of privileged JDV Immo workflow RPCs.
revoke all on function public.submit_immo_mandate(uuid) from public, anon;
grant execute on function public.submit_immo_mandate(uuid) to authenticated;

revoke all on function public.accept_immo_mandate(uuid) from public, anon;
grant execute on function public.accept_immo_mandate(uuid) to authenticated;

revoke all on function public.review_immo_agent_application(uuid, text, text) from public, anon;
grant execute on function public.review_immo_agent_application(uuid, text, text) to authenticated;

revoke all on function public.submit_immo_construction_brief(uuid) from public, anon;
grant execute on function public.submit_immo_construction_brief(uuid) to authenticated;
