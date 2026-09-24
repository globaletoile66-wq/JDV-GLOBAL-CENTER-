'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Wrench, ArrowLeft } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

function MaintenanceContent() {
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

        <div className="w-20 h-20 rounded-full bg-warning/10 border border-warning/20 flex items-center justify-center mx-auto mb-6">
          <Wrench size={40} className="text-warning" />
        </div>

        <div className="jdv-badge bg-warning/10 text-warning border-warning/20 mx-auto mb-4 inline-flex">
          En maintenance
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-3">{serviceName}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Ce service est temporairement en maintenance. Nous travaillons à le rétablir dans les meilleurs délais.
          Veuillez réessayer ultérieurement.
        </p>

        <Link href="/dashboard" className="btn-primary">
          <ArrowLeft size={16} />
          Retour à JDV GLOBAL CENTER
        </Link>
      </div>
    </div>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <MaintenanceContent />
    </Suspense>
  );
}
