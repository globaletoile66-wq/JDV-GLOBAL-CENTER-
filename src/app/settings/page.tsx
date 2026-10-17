'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Shield, Globe, Bell, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';

const TABS = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'security', label: 'Sécurité', icon: Shield },
  { id: 'language', label: 'Langue & Région', icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'privacy', label: 'Confidentialité', icon: Lock },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />Dashboard
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <AppLogo size={28} />
            <span className="font-semibold text-sm text-foreground">Paramètres</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-extrabold text-foreground mb-8">Paramètres du compte</h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar tabs */}
          <div className="lg:w-56 flex-shrink-0">
            <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
              {TABS?.map((tab) => (
                <button
                  key={tab?.id}
                  onClick={() => setActiveTab(tab?.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                    activeTab === tab?.id
                      ? 'bg-accent text-white' :'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab?.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeTab === 'profile' && (
              <div className="jdv-card">
                <h2 className="font-bold text-foreground mb-4">Informations du profil</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Gérez vos informations personnelles depuis la page de profil.
                </p>
                <Link href="/profile" className="btn-primary self-start inline-flex">
                  Modifier mon profil
                </Link>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="jdv-card">
                <h2 className="font-bold text-foreground mb-4">Sécurité du compte</h2>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Mot de passe</p>
                      <p className="text-xs text-muted-foreground">Dernière modification : inconnue</p>
                    </div>
                    <Link href="/profile" className="btn-secondary text-sm px-3 py-1.5">Modifier</Link>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Authentification à deux facteurs</p>
                      <p className="text-xs text-muted-foreground">Bientôt disponible</p>
                    </div>
                    <span className="jdv-badge text-xs bg-muted/20 text-muted-foreground">Prochainement</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Sessions actives</p>
                      <p className="text-xs text-muted-foreground">Gérez vos appareils connectés</p>
                    </div>
                    <span className="jdv-badge text-xs bg-muted/20 text-muted-foreground">Prochainement</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'language' && (
              <div className="jdv-card">
                <h2 className="font-bold text-foreground mb-4">Langue et région</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Modifiez vos préférences de langue, pays et devise depuis votre profil.
                </p>
                <Link href="/profile" className="btn-primary self-start inline-flex">
                  Modifier les préférences
                </Link>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="jdv-card">
                <h2 className="font-bold text-foreground mb-4">Préférences de notifications</h2>
                <div className="flex flex-col gap-4">
                  {[
                    { label: 'Notifications système', desc: 'Mises à jour importantes de la plateforme' },
                    { label: 'Notifications de sécurité', desc: 'Alertes de connexion et activité suspecte' },
                    { label: 'Notifications de services', desc: 'Mises à jour des services JDV' },
                  ]?.map((n) => (
                    <div key={n?.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{n?.label}</p>
                        <p className="text-xs text-muted-foreground">{n?.desc}</p>
                      </div>
                      <div className="w-10 h-5 rounded-full bg-accent relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="jdv-card">
                <h2 className="font-bold text-foreground mb-4">Confidentialité</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Gérez vos préférences de confidentialité et vos données personnelles.
                </p>
                <Link href="/profile" className="btn-primary self-start inline-flex">
                  Gérer mes données
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
