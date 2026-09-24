'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Globe, ChevronDown, Menu, X, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const languages = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

const navLinks = [
  { label: 'Services', href: '/services' },
  { label: 'À propos', href: '/about' },
  { label: 'Aide', href: '/help' },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(languages?.[0]);
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) return `${profile?.first_name?.[0]}${profile?.last_name?.[0]}`?.toUpperCase();
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-card/95 backdrop-blur-xl border-b border-border shadow-lg shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <AppLogo size={36} />
            <div className="flex flex-col leading-none">
              <span className="font-extrabold text-base tracking-tight text-foreground group-hover:text-accent transition-colors duration-150">
                JDV
              </span>
              <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase" style={{ fontSize: '9px' }}>
                Global Center
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks?.map((link) => (
              <Link key={`nav-${link?.label}`} href={link?.href} className="btn-ghost text-sm">
                {link?.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Language selector */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="btn-ghost flex items-center gap-1.5 text-sm"
              >
                <Globe size={15} />
                <span>{activeLang?.flag} {activeLang?.code?.toUpperCase()}</span>
                <ChevronDown size={13} className={`transition-transform duration-150 ${langOpen ? 'rotate-180' : ''}`} />
              </button>
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-44 bg-card-elevated rounded-xl border border-border shadow-xl animate-scale-in overflow-hidden">
                  {languages?.map((lang) => (
                    <button
                      key={`lang-${lang?.code}`}
                      onClick={() => { setActiveLang(lang); setLangOpen(false); }}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors duration-100 ${
                        activeLang?.code === lang?.code
                          ? 'text-accent bg-accent/10' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                      }`}
                    >
                      <span>{lang?.flag}</span>
                      <span>{lang?.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!loading && user ? (
              <>
                <Link href="/dashboard" className="btn-ghost text-sm flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white font-bold text-xs">
                    {profile?.avatar_url ? (
                      <img src={profile?.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : getInitials()}
                  </div>
                  Mon espace
                </Link>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-ghost text-sm">
                  Connexion
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm px-5 py-2.5">
                  Créer un compte
                </Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden btn-ghost p-2"
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-card/98 backdrop-blur-xl border-t border-border animate-fade-in">
          <div className="px-6 py-4 flex flex-col gap-1">
            {navLinks?.map((link) => (
              <Link
                key={`mobile-nav-${link?.label}`}
                href={link?.href}
                onClick={() => setMobileOpen(false)}
                className="py-3 px-2 text-sm font-medium text-muted-foreground hover:text-foreground border-b border-border/50 last:border-0 transition-colors"
              >
                {link?.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-3">
              {!loading && user ? (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center text-sm">
                  <LayoutDashboard size={15} />
                  Mon espace
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)} className="btn-secondary w-full justify-center text-sm">
                    Connexion
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center text-sm">
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}