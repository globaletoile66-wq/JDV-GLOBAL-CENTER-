'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Clock, ArrowLeft } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const serviceName = searchParams?.get('name') || 'Ce service';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <AppLogo size={36} />
          <div className="flex flex-col leading-none text-left">
            <span className="font-extrabold text-base text-foreground">JDV</span>
            <span className="text-xs text-muted-foreground tracking-widest uppercase">Global Center</span>
          </div>
        </div>

        <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
          <Clock size={40} className="text-accent" />
        </div>

        <div className="jdv-badge bg-accent/10 text-accent border-accent/20 mx-auto mb-4 inline-flex">
          Bientôt disponible
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-3">{serviceName}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Ce service est en cours de préparation. Notre équipe travaille activement à son développement.
          Revenez prochainement pour découvrir toutes ses fonctionnalités.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/services" className="btn-primary">
            Voir tous les services
          </Link>
          <Link href="/dashboard" className="btn-secondary">
            <ArrowLeft size={16} />
            Retour au dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <ComingSoonContent />
    </Suspense>
  );
}
