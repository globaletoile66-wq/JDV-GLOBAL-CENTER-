'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldOff, ArrowLeft, HelpCircle, Home } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

const REASON_MESSAGES: Record<string, { title: string; message: string; action: string }> = {
  super_admin_required: {
    title: 'Accès administrateur requis',
    message: 'Cette section est réservée aux Super Administrateurs de JDV GLOBAL CENTER. Si vous pensez avoir accès à cette section, contactez l\'équipe JDV.',
    action: 'Retour au tableau de bord',
  },
  subscription_required: {
    title: 'Abonnement requis',
    message: 'Ce service nécessite un abonnement actif. Découvrez nos offres pour accéder à toutes les fonctionnalités JDV.',
    action: 'Voir les offres',
  },
  module_disabled: {
    title: 'Service indisponible',
    message: 'Ce service est temporairement indisponible. Notre équipe travaille à le rétablir dans les meilleurs délais.',
    action: 'Retour aux services',
  },
  default: {
    title: 'Accès non autorisé',
    message: 'Vous n\'avez pas l\'autorisation d\'accéder à cette page. Si vous pensez qu\'il s\'agit d\'une erreur, contactez le support JDV.',
    action: 'Retour à l\'accueil',
  },
};

function AccessRequiredContent() {
  const searchParams = useSearchParams();
  const reason = searchParams?.get('reason') || 'default';
  const config = REASON_MESSAGES[reason] || REASON_MESSAGES.default;

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

        <div className="w-20 h-20 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={40} className="text-danger" />
        </div>

        <h1 className="text-2xl font-extrabold text-foreground mb-3">{config.title}</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">{config.message}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard" className="btn-primary">
            <Home size={16} />
            {config.action}
          </Link>
          <Link href="/help" className="btn-secondary">
            <HelpCircle size={16} />
            Contacter le support
          </Link>
        </div>

        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mt-8">
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

export default function AccessRequiredPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    }>
      <AccessRequiredContent />
    </Suspense>
  );
}
