# JDV country-aware onboarding and local services — 21 October 2026

## Objective
Collect an explicit country during account creation, persist it in the existing profile, use it as the default market for health searches, and capture a country plus its default currency when registering a company.

## Implemented in this work branch
- Registration asks for country, phone and email; the calling code is shown and included in the stored phone value.
- Registration passes country ID and phone as Supabase Auth metadata.
- Migration updates the existing `handle_new_user()` trigger to copy country, phone, country-default language/currency and timezone into the existing `profiles` row. It does not create a duplicate profile table.
- Onboarding prefills country/language/currency from the profile and signup metadata.
- Company creation requires a country, uses the existing `business_register_company` RPC parameters `p_country_id` and `p_currency_id`, and formats the phone using the country calling code. The existing RPC creates the business as a draft/private record.
- JDV Santé's public business directory defaults to the signed-in profile's country. Existing city, district and geolocation controls remain in place.
- A migration corrects country currency defaults for Brazil, Guinea and Morocco and adds BRL/GNF to the existing currency reference table.

## Existing schema verified read-only
- `profiles.country_id` already references `countries.id`.
- `profiles.phone` already exists.
- `business_profiles.country_id` and `business_profiles.currency_id` already exist.
- The existing company-registration RPC already accepts country and currency IDs.
- The active country reference currently contains Benin, Côte d'Ivoire and other countries; country selection is based on the user's explicit choice, not inferred IP/geolocation.

## Safety and scope
- Reuses existing `profiles`, `countries`, `currencies` and `business_profiles` tables.
- No CRM historique changes.
- No remote Supabase migration was applied; the SQL files are proposed in this PR and must be reviewed/applied through the project's normal migration workflow.
- No production deployment performed.
- The country filter is implemented in JDV Santé's business directory in this phase. Extending country-aware filtering to every module's searches is a follow-up integration task; modules should use the saved profile country and allow the user to change location explicitly.
- Location permission is not required for country-level defaults; precise geolocation remains optional.
