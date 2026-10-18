-- JDV Transit 360: baseline checklist entries are deliberately non-mandatory.
-- Country- and cargo-specific requirements must be reviewed by an authorized transit professional.
insert into public.transit_document_requirements
  (country_id, operation_type, mode, document_type, is_mandatory)
select null, null, null, seed.document_type, false
from (values
  ('Facture commerciale'),
  ('Liste de colisage (packing list)'),
  ('Connaissement maritime ou lettre de transport applicable'),
  ('Certificat d’origine — à confirmer selon le régime'),
  ('Licences, permis ou certificats spécifiques à la marchandise — à confirmer')
) as seed(document_type)
where not exists (
  select 1 from public.transit_document_requirements existing
  where existing.country_id is null
    and existing.operation_type is null
    and existing.mode is null
    and existing.document_type = seed.document_type
);
