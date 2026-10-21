'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings2, UserRoundPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { JDV_APPLICATIONS } from '@/lib/apps/registry';

export default function ApplicationAccountShortcut() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  if (!pathname || pathname.startsWith('/inscription/') || pathname.startsWith('/applications/') || pathname.startsWith('/auth/') || pathname.startsWith('/hidden-concepteur-gate') || pathname === '/marketplace/connexion' || pathname === '/sign-up-login-screen') return null;

  const app = [...JDV_APPLICATIONS]
    .sort((a, b) => b.homePath.length - a.homePath.length)
    .find((item) => pathname === item.homePath || pathname.startsWith(item.homePath + '/'));
  if (!app) return null;

  const href = user ? `/applications/${app.key}/settings` : `/inscription/${app.key}`;
  return (
    <Link
      href={href}
      aria-label={user ? `Profil et paramètres de ${app.name}` : `Créer un compte pour ${app.name}`}
      className="fixed bottom-24 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#0B1B3D] px-4 py-3 text-xs font-extrabold text-white shadow-xl transition hover:bg-[#173967] sm:bottom-6 sm:right-6 sm:px-5 sm:text-sm"
    >
      {user ? <Settings2 size={17} className="text-[#F28C28]" /> : <UserRoundPlus size={17} className="text-[#F28C28]" />}
      <span>{loading ? 'Espace application' : user ? 'Profil & paramètres' : 'Créer un compte'}</span>
    </Link>
  );
}
