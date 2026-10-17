'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, Bell, CreditCard, Wallet, Info } from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';

export default function PaySettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3">
        <Link href="/pay" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <div>
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Paramètres</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Paramètres JDV PAY</h2>
          <p className="text-sm text-muted-foreground">Gérez vos préférences et paramètres de paiement.</p>
        </div>

        <div className="jdv-card divide-y divide-border">
          {[
            { href: '/pay/kyc', icon: <Shield size={16} />, label: 'Vérification d\'identité (KYC)', description: 'Gérez votre niveau de vérification' },
            { href: '/pay/beneficiaries', icon: <Wallet size={16} />, label: 'Bénéficiaires', description: 'Gérez vos bénéficiaires de transfert' },
            { href: '/settings', icon: <Bell size={16} />, label: 'Notifications', description: 'Préférences de notification' },
            { href: '/settings', icon: <CreditCard size={16} />, label: 'Méthodes de paiement', description: 'Gérez vos méthodes de paiement liées' },
          ]?.map(({ href, icon, label, description }) => (
            <Link key={label} href={href} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/10 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <ArrowLeft size={14} className="text-muted-foreground rotate-180 flex-shrink-0" />
            </Link>
          ))}
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl bg-info/10 border border-info/20">
          <Info size={16} className="text-info flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-info mb-0.5">JDV PAY — Version 1.0</p>
            <p className="text-xs text-muted-foreground">
              JDV PAY est la première branche financière de JDV GLOBAL CENTER. Les fonctionnalités complètes seront disponibles progressivement.
            </p>
          </div>
        </div>

        <Link href="/pay" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Retour au tableau de bord PAY
        </Link>
      </div>
    </div>
  );
}
