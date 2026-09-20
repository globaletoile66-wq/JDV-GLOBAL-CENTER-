import { createBrowserClient } from '@supabase/ssr';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return [];
          return document.cookie
            .split(';')
            .filter(Boolean)
            .map((cookie) => {
              const index = cookie.indexOf('=');
              return {
                name: cookie.slice(0, index).trim(),
                value: index >= 0 ? decodeURIComponent(cookie.slice(index + 1).trim()) : '',
              };
            });
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return;
          cookiesToSet.forEach(({ name, value, options }) => {
            const parts = [
              `${name}=${encodeURIComponent(value)}`,
              `Path=${options?.path ?? '/'}`,
              options?.maxAge != null ? `Max-Age=${options.maxAge}` : '',
              options?.domain ? `Domain=${options.domain}` : '',
              options?.sameSite ? `SameSite=${options.sameSite}` : 'SameSite=Lax',
              options?.secure ? 'Secure' : '',
            ].filter(Boolean);
            document.cookie = parts.join('; ');
          });
        },
      },
    },
  );

  return browserClient;
}
