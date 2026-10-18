-- Register the nine documented JDV branches that are absent from public.modules.
-- These rows are planned catalogue entries only; they do not claim the features are implemented.
insert into public.modules
  (id, code, name, description, icon, category, module_status, version, is_public, requires_subscription, sort_order)
values
  (gen_random_uuid(), 'jdv_community', 'JDV COMMUNITY', 'Espaces communautaires et animation des communautés JDV', '👥', 'community', 'planned', '0.0.1', true, false, 19),
  (gen_random_uuid(), 'jdv_services', 'JDV SERVICES', 'Catalogue de services et demandes de prestations', '🛠️', 'services', 'planned', '0.0.1', true, false, 20),
  (gen_random_uuid(), 'jdv_events', 'JDV EVENTS', 'Organisation et gestion d’événements', '📅', 'events', 'planned', '0.0.1', true, false, 21),
  (gen_random_uuid(), 'jdv_jobs', 'JDV JOBS', 'Offres d’emploi, candidatures et recrutement', '💼', 'jobs', 'planned', '0.0.1', true, false, 22),
  (gen_random_uuid(), 'jdv_legal', 'JDV LEGAL', 'Services et ressources juridiques', '⚖️', 'legal', 'planned', '0.0.1', true, false, 23),
  (gen_random_uuid(), 'jdv_accounting', 'JDV ACCOUNTING', 'Comptabilité, écritures et clôtures financières', '🧮', 'accounting', 'planned', '0.0.1', true, false, 24),
  (gen_random_uuid(), 'jdv_hr', 'JDV HR', 'Gestion des ressources humaines', '👤', 'hr', 'planned', '0.0.1', true, false, 25),
  (gen_random_uuid(), 'jdv_procurement', 'JDV PROCUREMENT', 'Achats, demandes et validations fournisseurs', '📋', 'procurement', 'planned', '0.0.1', true, false, 26),
  (gen_random_uuid(), 'jdv_inventory', 'JDV INVENTORY', 'Stocks, mouvements et traçabilité des articles', '📦', 'inventory', 'planned', '0.0.1', true, false, 27)
on conflict (code) do nothing;
