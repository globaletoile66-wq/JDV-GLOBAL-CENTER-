import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { mfaRedirect } from '@/lib/auth/middlewareGuards';

function getProjectRef(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return url.match(/https:\/\/([^.]+)\./)?.[1] ?? '';
}

function isPathOrChild(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

function injectTokenFromHeader(request: NextRequest): void {
  const token = request.headers.get('x-sb-token');
  if (!token) return;
  const hasCookie = request.cookies.getAll().some((c) => c.name.includes('auth-token'));
  if (hasCookie) return;
  request.cookies.set(`sb-${getProjectRef()}-auth-token`, token);
}

export async function middleware(request: NextRequest) {
  injectTokenFromHeader(request);
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Separate public browsing from app-specific account/workspace routes.
  const tontineActionRoute =
    isPathOrChild(pathname, '/tontine/concepteur') ||
    pathname === '/tontine/contrat' ||
    (pathname.startsWith('/tontine/categories/') && pathname.endsWith('/contrat')) ||
    isPathOrChild(pathname, '/tontine/join');
  const globalCenterRoute = [
    '/dashboard', '/user-dashboard', '/profile', '/settings', '/notifications',
    '/organizations', '/onboarding', '/terrain', '/abonnements', '/espace',
  ].some((route) => isPathOrChild(pathname, route));
  const requiredAppKey =
    isPathOrChild(pathname, '/pay') ? 'pay' :
    isPathOrChild(pathname, '/business') ? 'business' :
    tontineActionRoute ? 'tontine' :
    globalCenterRoute ? 'global_center' : null;

  const protectedPaths = ['/dashboard', '/user-dashboard', '/profile', '/settings', '/notifications', '/organizations', '/onboarding', '/pay', '/business', '/terrain', '/abonnements', '/espace'];
  const isProtected = protectedPaths.some((p) => isPathOrChild(pathname, p)) || tontineActionRoute;

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = requiredAppKey && ['pay', 'business', 'tontine'].includes(requiredAppKey)
      ? `/inscription/${requiredAppKey}`
      : '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isProtected) {
    const mfa = await mfaRedirect(supabase, request);
    if (mfa) return mfa;
  }

  // A valid global session alone does not grant access to another application's workspace.
  if (user && requiredAppKey) {
    const { data: isSuperAdmin, error: adminError } = await supabase.rpc('is_super_admin');
    if (adminError || isSuperAdmin !== true) {
      const { data: appMembership, error: membershipError } = await supabase
        .from('app_memberships')
        .select('id,status')
        .eq('user_id', user.id)
        .eq('app_key', requiredAppKey)
        .maybeSingle();

      if (membershipError || !appMembership || appMembership.status !== 'active') {
        const url = request.nextUrl.clone();
        url.pathname = `/inscription/${requiredAppKey}`;
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    }
  }

  // Hidden concepteur portal: authentication plus server-side authorization.
  if (isPathOrChild(pathname, '/hidden-concepteur-gate')) {
    if (!user) {
      if (pathname !== '/hidden-concepteur-gate/login') {
        const url = request.nextUrl.clone();
        url.pathname = '/hidden-concepteur-gate/login';
        url.searchParams.set('redirect', pathname);
        return NextResponse.redirect(url);
      }
    } else if (pathname !== '/hidden-concepteur-gate/login') {
      const { data: allowed } = await supabase.rpc('is_super_admin');
      if (allowed !== true) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  // Legacy super-admin route
  if (isPathOrChild(pathname, '/super-admin')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url);
    }

    const { data: allowed } = await supabase.rpc('is_super_admin');
    if (allowed !== true) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/auth/login' || pathname === '/auth/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
