import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Globe2, Zap } from 'lucide-react';

const stats = [
  { value: '18+', label: 'Services intégrés', icon: Zap },
  { value: '50+', label: 'Pays disponibles', icon: Globe2 },
  { value: '100%', label: 'Sécurisé & chiffré', icon: ShieldCheck },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-jdv-hero pt-20">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="blob-primary absolute w-[600px] h-[600px] -top-40 left-1/2 -translate-x-1/2 opacity-60" />
        <div className="blob-accent absolute w-[400px] h-[400px] top-1/3 right-0 opacity-40" />
        <div className="blob-primary absolute w-[300px] h-[300px] bottom-0 left-0 opacity-30" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(165,180,252,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(165,180,252,0.3) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16 py-20 lg:py-28 text-center">
        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold tracking-widest uppercase mb-8 animate-slide-up">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Écosystème Numérique International
        </div>

        {/* Headline */}
        <h1 className="text-hero-xl text-foreground mb-6 max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: '80ms' }}>
          Votre vie numérique,{' '}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)' }}>
            réunie en un seul endroit
          </span>
        </h1>

        {/* Sub */}
        <p className="text-base lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed animate-slide-up font-normal" style={{ animationDelay: '160ms' }}>
          JDV GLOBAL CENTER regroupe paiements, commerce, immobilier, santé, énergie,
          formation et bien plus dans un écosystème sécurisé conçu pour l'Afrique et le monde.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <Link href="/sign-up-login-screen" className="btn-primary text-base px-8 py-4 glow-orange">
            Créer mon compte gratuitement
            <ArrowRight size={18} />
          </Link>
          <Link href="/sign-up-login-screen" className="btn-secondary text-base px-8 py-4">
            Se connecter
          </Link>
        </div>

        {/* Stats row */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 lg:gap-12 animate-slide-up" style={{ animationDelay: '320ms' }}>
          {stats?.map((stat) => (
            <div key={`stat-${stat?.label}`} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                <stat.icon size={18} className="text-accent" />
              </div>
              <div className="text-left">
                <div className="text-2xl font-extrabold text-foreground font-tabular">{stat?.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{stat?.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="mt-20 flex flex-col items-center gap-2 opacity-50">
          <span className="text-xs text-muted-foreground tracking-widest uppercase">Découvrir</span>
          <div className="w-px h-12 bg-gradient-to-b from-muted-foreground to-transparent" />
        </div>
      </div>
    </section>
  );
}