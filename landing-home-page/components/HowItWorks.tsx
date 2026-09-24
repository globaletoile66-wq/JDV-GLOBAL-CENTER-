import React from 'react';
import { UserPlus, MapPin, Settings2, LayoutGrid } from 'lucide-react';

const steps = [
  {
    id: 'step-1',
    number: '01',
    icon: UserPlus,
    title: 'Créer un compte',
    description:
      'Inscrivez-vous en quelques minutes avec votre email. Un seul compte pour accéder à tout l\'écosystème JDV.',
    color: '#F97316',
  },
  {
    id: 'step-2',
    number: '02',
    icon: MapPin,
    title: 'Choisir son pays',
    description:
      'Sélectionnez votre pays de résidence. JDV adapte automatiquement la langue, la devise et les services disponibles.',
    color: '#3B82F6',
  },
  {
    id: 'step-3',
    number: '03',
    icon: Settings2,
    title: 'Configurer son profil',
    description:
      'Complétez votre profil personnel ou créez votre organisation. Définissez vos préférences et paramètres.',
    color: '#10B981',
  },
  {
    id: 'step-4',
    number: '04',
    icon: LayoutGrid,
    title: 'Accéder aux services',
    description:
      'Explorez et activez les modules JDV dont vous avez besoin. Tous interconnectés, tous sécurisés.',
    color: '#8B5CF6',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="blob-accent absolute w-[400px] h-[400px] bottom-0 right-0 opacity-15" />
      </div>

      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/30 border border-primary-light/30 text-secondary-foreground text-xs font-semibold tracking-widest uppercase mb-6">
            Comment ça marche
          </div>
          <h2 className="text-hero-lg text-foreground mb-4">
            Simple.{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)' }}>
              Rapide.
            </span>{' '}
            Sécurisé.
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto">
            Rejoignez JDV GLOBAL CENTER en 4 étapes et accédez à l'ensemble de l'écosystème.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-4 gap-6 lg:gap-8">
          {steps?.map((step, idx) => (
            <div key={step?.id} className="relative group">
              {/* Connector line (desktop) */}
              {idx < steps?.length - 1 && (
                <div className="hidden xl:block absolute top-8 left-full w-full h-px z-0" style={{ background: `linear-gradient(90deg, ${step?.color}40, transparent)`, width: 'calc(100% - 2.5rem)', left: '80%' }} />
              )}

              <div className="jdv-card relative z-10 h-full" style={{ borderColor: `${step?.color}25` }}>
                {/* Number + icon */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200"
                    style={{ background: `${step?.color}20`, border: `1px solid ${step?.color}30` }}
                  >
                    <step.icon size={22} style={{ color: step?.color }} />
                  </div>
                  <span className="text-3xl font-extrabold font-tabular" style={{ color: `${step?.color}40` }}>
                    {step?.number}
                  </span>
                </div>

                <h3 className="font-bold text-base text-foreground mb-2">{step?.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}