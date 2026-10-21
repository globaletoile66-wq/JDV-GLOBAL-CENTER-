'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronDown, ChevronRight, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { CONTACT } from '@/lib/jdv/contact';
import AppLogo from '@/components/ui/AppLogo';
import GlobalHeader from '@/components/navigation/GlobalHeader';

const FAQ_ITEMS = [
  {
    id: 'faq-1',
    question: 'Comment créer un compte JDV GLOBAL CENTER ?',
    answer: 'Cliquez sur "Créer un compte" depuis la page d\'accueil. Renseignez votre prénom, nom, email et mot de passe. Votre compte sera créé instantanément.',
    category: 'Compte',
  },
  {
    id: 'faq-2',
    question: 'Comment accéder aux différents services JDV ?',
    answer: 'Depuis votre tableau de bord, cliquez sur "Services" pour voir tous les modules disponibles. Cliquez sur un service pour y accéder. Les services en développement seront disponibles prochainement.',
    category: 'Services',
  },
  {
    id: 'faq-3',
    question: 'Comment créer une organisation ?',
    answer: 'Depuis votre tableau de bord, allez dans "Organisations" puis cliquez sur "Créer". Renseignez le nom, le pays et le type de votre organisation. Vous serez automatiquement désigné comme propriétaire.',
    category: 'Organisations',
  },
  {
    id: 'faq-4',
    question: 'Comment inviter des membres dans mon organisation ?',
    answer: 'Dans la section "Organisations", sélectionnez votre organisation puis allez dans "Membres". Cliquez sur "Inviter" et entrez l\'email de la personne à inviter avec le rôle souhaité.',
    category: 'Organisations',
  },
  {
    id: 'faq-5',
    question: 'Comment changer mon mot de passe ?',
    answer: 'Allez dans "Mon profil" puis dans l\'onglet "Sécurité". Entrez votre nouveau mot de passe et confirmez-le. Si vous avez oublié votre mot de passe, utilisez "Mot de passe oublié" sur la page de connexion.',
    category: 'Sécurité',
  },
  {
    id: 'faq-6',
    question: 'JDV GLOBAL CENTER est-il disponible dans mon pays ?',
    answer: 'JDV GLOBAL CENTER est une plateforme internationale. Certains services peuvent être limités selon les pays. Lors de votre inscription, sélectionnez votre pays pour voir les services disponibles.',
    category: 'Général',
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const filtered = FAQ_ITEMS?.filter((f) =>
    !searchQuery || f?.question?.toLowerCase()?.includes(searchQuery?.toLowerCase()) || f?.answer?.toLowerCase()?.includes(searchQuery?.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-foreground mb-3">Comment pouvons-nous vous aider ?</h1>
          <p className="text-muted-foreground mb-6">Trouvez des réponses à vos questions sur JDV GLOBAL CENTER</p>
          <div className="relative max-w-md mx-auto">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Rechercher dans l'aide..."
              className="jdv-input pl-11 py-3.5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e?.target?.value)}
            />
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-foreground mb-6">Questions fréquentes</h2>
          {filtered?.length === 0 ? (
            <div className="jdv-card text-center py-8">
              <p className="text-muted-foreground">Aucun résultat pour "{searchQuery}"</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered?.map((faq) => (
                <div key={faq?.id} className="jdv-card overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq?.id ? null : faq?.id)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="jdv-badge text-xs bg-muted/30 text-muted-foreground">{faq?.category}</span>
                      <span className="font-semibold text-foreground text-sm">{faq?.question}</span>
                    </div>
                    {openFaq === faq?.id ? <ChevronDown size={16} className="text-muted-foreground flex-shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground flex-shrink-0" />}
                  </button>
                  {openFaq === faq?.id && (
                    <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq?.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coordonnées officielles : affichées uniquement dans le Centre d'aide */}
        <section aria-labelledby="help-contact-title" className="jdv-card">
          <h2 id="help-contact-title" className="text-xl font-bold text-foreground mb-2">Contacter le Centre d'aide</h2>
          <p className="text-sm text-muted-foreground mb-6">Notre équipe est à votre écoute pour vos questions sur JDV GLOBAL CENTER.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CONTACT.email && (
              <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/40 transition-colors">
                <span className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><Mail size={20} className="text-accent" /></span>
                <span className="min-w-0"><span className="block font-semibold text-foreground text-sm">E-mail</span><span className="block text-sm text-muted-foreground break-all">{CONTACT.email}</span></span>
              </a>
            )}
            {CONTACT.phone?.map((phone, index) => (
              <a key={phone} href={`tel:${phone.replace(/[^+\\d]/g, '')}`} className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-accent/40 transition-colors">
                <span className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><Phone size={20} className="text-accent" /></span>
                <span className="min-w-0"><span className="block font-semibold text-foreground text-sm">Téléphone {index + 1}</span><span className="block text-sm text-muted-foreground">{phone}</span></span>
              </a>
            ))}
            {CONTACT.address && (
              <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
                <span className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><MapPin size={20} className="text-accent" /></span>
                <span><span className="block font-semibold text-foreground text-sm">Adresse</span><span className="block text-sm text-muted-foreground">{CONTACT.address}</span></span>
              </div>
            )}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-border">
              <span className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center"><MessageCircle size={20} className="text-accent" /></span>
              <span><span className="block font-semibold text-foreground text-sm">Chat</span><span className="block text-sm text-muted-foreground">Bientôt disponible</span></span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
