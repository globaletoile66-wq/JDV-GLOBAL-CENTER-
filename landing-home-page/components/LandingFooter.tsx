import React from 'react';
import Link from 'next/link';
import AppLogo from '@/components/ui/AppLogo';
import { Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = {
  services: {
    label: 'Services',
    links: [
      { id: 'fl-pay', label: 'JDV PAY', href: '#' },
      { id: 'fl-crm', label: 'JDV CRM', href: '#' },
      { id: 'fl-marketplace', label: 'JDV MARKETPLACE', href: '#' },
      { id: 'fl-immo', label: 'JDV IMMO', href: '#' },
      { id: 'fl-academy', label: 'JDV ACADEMY', href: '#' },
    ],
  },
  company: {
    label: 'Entreprise',
    links: [
      { id: 'fl-about', label: 'À propos de JDV', href: '#' },
      { id: 'fl-careers', label: 'Carrières', href: '#' },
      { id: 'fl-press', label: 'Presse', href: '#' },
      { id: 'fl-partners', label: 'Partenaires', href: '#' },
    ],
  },
  support: {
    label: 'Assistance',
    links: [
      { id: 'fl-help', label: 'Centre d\'aide', href: '#' },
      { id: 'fl-contact', label: 'Nous contacter', href: '#' },
      { id: 'fl-status', label: 'Statut des services', href: '#' },
      { id: 'fl-community', label: 'Communauté', href: '#' },
    ],
  },
  legal: {
    label: 'Légal',
    links: [
      { id: 'fl-privacy', label: 'Confidentialité', href: '#' },
      { id: 'fl-terms', label: 'Conditions d\'utilisation', href: '#' },
      { id: 'fl-cookies', label: 'Politique cookies', href: '#' },
      { id: 'fl-rgpd', label: 'RGPD / Protection des données', href: '#' },
    ],
  },
};

export default function LandingFooter() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <AppLogo size={36} />
              <div className="flex flex-col leading-none">
                <span className="font-extrabold text-base tracking-tight text-foreground">JDV</span>
                <span className="text-xs font-medium text-muted-foreground tracking-widest uppercase" style={{ fontSize: '9px' }}>
                  Global Center
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-xs">
              L'écosystème numérique international JDV — services financiers, commerciaux,
              professionnels et sociaux réunis en une seule plateforme.
            </p>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail size={13} className="text-accent flex-shrink-0" />
                <span>contact@jdvglobalcenter.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Phone size={13} className="text-accent flex-shrink-0" />
                <span>+229 XX XX XX XX</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin size={13} className="text-accent flex-shrink-0" />
                <span>Cotonou, Bénin — International</span>
              </div>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks)?.map(([key, section]) => (
            <div key={`footer-section-${key}`}>
              <h4 className="section-label mb-4">{section?.label}</h4>
              <ul className="flex flex-col gap-2.5">
                {section?.links?.map((link) => (
                  <li key={link?.id}>
                    <a
                      href={link?.href}
                      className="text-sm text-muted-foreground hover:text-foreground hover:text-accent transition-colors duration-150"
                    >
                      {link?.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 JDV GLOBAL CENTER. Tous droits réservés. Plateforme internationale.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">🇫🇷 Français</span>
            <span className="text-xs text-muted-foreground">XOF / USD / EUR</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs text-success font-medium">Tous les systèmes opérationnels</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}