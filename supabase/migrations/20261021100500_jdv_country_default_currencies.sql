-- Align country defaults with local currencies used for display and business onboarding.
-- This migration is committed for review only and is not applied remotely by this change.
insert into public.currencies (code, name, symbol, decimal_places, is_active)
values
  ('BRL', 'Brazilian Real', 'R$', 2, true),
  ('GNF', 'Guinean Franc', 'FG', 0, true)
on conflict (code) do update
set name = excluded.name,
    symbol = excluded.symbol,
    decimal_places = excluded.decimal_places,
    is_active = true,
    updated_at = now();

update public.countries c
set default_currency_id = cur.id,
    updated_at = now()
from public.currencies cur
where (c.iso_code = 'BR' and cur.code = 'BRL')
   or (c.iso_code = 'GN' and cur.code = 'GNF')
   or (c.iso_code = 'MA' and cur.code = 'MAD');
