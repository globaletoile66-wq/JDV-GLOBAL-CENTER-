import React from 'react';
import { ShieldCheck, Lock, Eye, FileCheck, Server, RefreshCw } from 'lucide-react';

const features = [
  {
    id: 'sec-rbac',
    icon: ShieldCheck,
    title: 'RBAC & Permissions',
    description: 'Contrôle d\'accès basé sur les rôles avec permissions granulaires par module et organisation.',
    color: '#10B981',
  },
  {
    id: 'sec-rls',
    icon: Lock,
    title: 'Row Level Security',
    description: 'Isolation totale des données entre organisations grâce aux politiques RLS PostgreSQL.',
    color: '#3B82F6',
  },
  {
    id: 'sec-audit',
    icon: Eye,
    title: 'Audit & Traçabilité',
    description: 'Toutes les opérations sensibles sont tracées avec horodatage, IP et contexte complet.',
    color: '#F97316',
  },
  {
    id: 'sec-validate',
    icon: FileCheck,
    title: 'Validation multi-niveaux',
    description: 'Validation côté client, serveur et base de données. Aucune donnée non validée n\'est traitée.',
    color: '#8B5CF6',
  },
  {
    id: 'sec-infra',
    icon: Server,
    title: 'Infrastructure sécurisée',
    description: 'Architecture Supabase avec chiffrement en transit et au repos. Secrets jamais exposés au navigateur.',
    color: '#F59E0B',
  },
  {
    id: 'sec-session',
    icon: RefreshCw,
    title: 'Sessions sécurisées',
    description: 'Gestion des sessions avec refresh automatique, déconnexion globale et contrôle des appareils.',
    color: '#EC4899',
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-primary absolute w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 text-success text-xs font-semibold tracking-widest uppercase mb-6">
              <ShieldCheck size={13} />
              Sécurité de niveau entreprise
            </div>
            <h2 className="text-hero-lg text-foreground mb-6">
              Votre sécurité,{' '}
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #10B981 0%, #3B82F6 100%)' }}>
                notre priorité absolue
              </span>
            </h2>
            <p className="text-muted-foreground text-base lg:text-lg leading-relaxed mb-8">
              JDV GLOBAL CENTER a été conçu dès le premier jour avec une architecture de sécurité
              multi-niveaux. Vos données, transactions et organisations sont protégées à chaque étape.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-3">
              {['PostgreSQL RLS', 'RBAC', 'AES-256', 'HTTPS/TLS', 'MFA Ready', 'RGPD']?.map((badge) => (
                <span key={`badge-${badge}`} className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border text-xs font-semibold text-muted-foreground">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Right grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features?.map((feat) => (
              <div key={feat?.id} className="jdv-card group" style={{ borderColor: `${feat?.color}20` }}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200"
                  style={{ background: `${feat?.color}15`, border: `1px solid ${feat?.color}25` }}
                >
                  <feat.icon size={18} style={{ color: feat?.color }} />
                </div>
                <h3 className="font-bold text-sm text-foreground mb-1.5">{feat?.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{feat?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}