import React from 'react';
import { ShieldCheck, Globe2, Zap, Users } from 'lucide-react';

const highlights = [
  { id: 'hl-1', icon: ShieldCheck, text: 'Sécurité de niveau entreprise avec RLS & RBAC' },
  { id: 'hl-2', icon: Globe2, text: 'Disponible dans 50+ pays, multi-devises' },
  { id: 'hl-3', icon: Zap, text: '18+ services intégrés dans un seul compte' },
  { id: 'hl-4', icon: Users, text: 'Gestion d\'organisations et d\'équipes' },
];

export default function AuthBrandPanel() {
  return (
    <div className="relative flex flex-col w-full bg-jdv-gradient overflow-hidden p-10 xl:p-14 2xl:p-16">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-primary absolute w-[500px] h-[500px] -top-20 -left-20 opacity-40" />
        <div className="blob-accent absolute w-[300px] h-[300px] bottom-20 right-0 opacity-30" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(165,180,252,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(165,180,252,0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-16">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
            J
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-base tracking-tight text-white">JDV</span>
            <span className="text-xs font-medium text-white/50 tracking-widest uppercase" style={{ fontSize: '9px' }}>
              Global Center
            </span>
          </div>
        </div>

        {/* Main pitch */}
        <div className="flex-1">
          <h2 className="text-display text-white mb-3 leading-tight">
            Bienvenue dans l'écosystème
          </h2>
          <h1 className="text-3xl xl:text-4xl font-extrabold text-transparent bg-clip-text mb-8" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)' }}>
            JDV GLOBAL CENTER
          </h1>
          <p className="text-white/60 text-sm lg:text-base leading-relaxed mb-10 max-w-sm">
            Une plateforme, tous vos services numériques. Paiements, commerce, immobilier,
            santé, formation et bien plus — réunis sous un seul compte sécurisé.
          </p>

          {/* Highlights */}
          <div className="flex flex-col gap-4">
            {highlights?.map((item) => (
              <div key={item?.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
                  <item.icon size={15} className="text-accent" />
                </div>
                <span className="text-sm text-white/75 font-medium">{item?.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            {['Sécurisé', 'Multi-pays', 'Multi-devises', 'RGPD']?.map((tag) => (
              <span key={`trust-${tag}`} className="px-2.5 py-1 rounded-lg bg-white/10 text-white/60 text-xs font-medium border border-white/10">
                {tag}
              </span>
            ))}
          </div>
          <p className="text-white/30 text-xs mt-4">
            © 2026 JDV GLOBAL CENTER. Tous droits réservés.
          </p>
        </div>
      </div>
    </div>
  );
}