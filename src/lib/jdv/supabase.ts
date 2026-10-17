// Client navigateur unique de l'application (même session que le reste du site).
import { createClient } from '@/lib/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!client) client = createClient() as unknown as SupabaseClient;
  return client;
}
