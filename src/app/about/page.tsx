'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe2, Shield, Zap, Users, Building2 } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

const MODULES = [
  { icon: '💳', name: 'JDV PAY', desc: 'Paiements et services financiers' },
  { icon: '📊', name: 'JDV CRM', desc: 'Gestion commerciale' },
  { icon: '🏠', name: 'JDV IMMO', desc: 'Immobilier et location' },
  { icon: '✈️', name: 'JDV TRAVEL', desc: 'Voyages et tourisme' },
  { icon: '🎓', name: 'JDV ACADEMY', desc: 'Formation et éducation' },
  { icon: '🤖', name: 'JDV IA', desc: 'Intelligence artificielle' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />Accueil
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <AppLogo size={28} />
            <span className="font-semibold text-sm text-foreground">À propos</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <AppLogo size={64} />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-4">JDV GLOBAL CENTER</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Un écosystème numérique international regroupant progressivement plusieurs services numériques, financiers, commerciaux, professionnels et sociaux.
          </p>
        </div>

        {/* Vision & Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="jdv-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Globe2 size={20} className="text-accent" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Notre Vision</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Devenir la plateforme numérique de référence en Afrique et dans le monde, offrant à chaque individu et organisation les outils nécessaires pour prospérer dans l'économie numérique mondiale.
            </p>
          </div>
          <div className="jdv-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Zap size={20} className="text-accent" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Notre Mission</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Simplifier l'accès aux services numériques essentiels grâce à un compte unique, une interface unifiée et une infrastructure sécurisée adaptée aux réalités locales et internationales.
            </p>
          </div>
        </div>

        {/* Services */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">L'écosystème JDV</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {MODULES?.map((m) => (
              <div key={m?.name} className="jdv-card text-center p-4">
                <div className="text-3xl mb-2">{m?.icon}</div>
                <p className="font-bold text-sm text-foreground">{m?.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{m?.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Shield, title: 'Sécurité', desc: 'Vos données sont protégées par des standards de sécurité internationaux.' },
            { icon: Users, title: 'Accessibilité', desc: 'Une plateforme conçue pour tous, partout dans le monde.' },
            { icon: Building2, title: 'Professionnalisme', desc: 'Des services de qualité pour les individus et les organisations.' },
          ]?.map((v) => (
            <div key={v?.title} className="jdv-card text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <v.icon size={24} className="text-accent" />
              </div>
              <h3 className="font-bold text-foreground mb-2">{v?.title}</h3>
              <p className="text-sm text-muted-foreground">{v?.desc}</p>
            </div>
          ))}
        </div>

        {/* Legal */}
        <div className="jdv-card text-center">
          <p className="text-sm text-muted-foreground mb-4">
            © {new Date()?.getFullYear()} JDV GLOBAL CENTER. Tous droits réservés.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/privacy" className="text-sm text-accent hover:text-accent-light transition-colors">Politique de confidentialité</Link>
            <Link href="/terms" className="text-sm text-accent hover:text-accent-light transition-colors">Conditions d'utilisation</Link>
            <Link href="/help" className="text-sm text-accent hover:text-accent-light transition-colors">Centre d'aide</Link>
            <a href="mailto:contact@jdvglobal.com" className="text-sm text-accent hover:text-accent-light transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}
