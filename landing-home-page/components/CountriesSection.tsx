import React from 'react';

const countries = [
  { id: 'c-bj', flag: '🇧🇯', name: 'Bénin', currency: 'XOF', status: 'active' },
  { id: 'c-sn', flag: '🇸🇳', name: 'Sénégal', currency: 'XOF', status: 'active' },
  { id: 'c-ci', flag: '🇨🇮', name: 'Côte d\'Ivoire', currency: 'XOF', status: 'active' },
  { id: 'c-ml', flag: '🇲🇱', name: 'Mali', currency: 'XOF', status: 'active' },
  { id: 'c-bf', flag: '🇧🇫', name: 'Burkina Faso', currency: 'XOF', status: 'active' },
  { id: 'c-ng', flag: '🇳🇬', name: 'Nigeria', currency: 'NGN', status: 'active' },
  { id: 'c-gh', flag: '🇬🇭', name: 'Ghana', currency: 'GHS', status: 'active' },
  { id: 'c-cm', flag: '🇨🇲', name: 'Cameroun', currency: 'XAF', status: 'active' },
  { id: 'c-fr', flag: '🇫🇷', name: 'France', currency: 'EUR', status: 'active' },
  { id: 'c-us', flag: '🇺🇸', name: 'États-Unis', currency: 'USD', status: 'coming' },
  { id: 'c-gb', flag: '🇬🇧', name: 'Royaume-Uni', currency: 'GBP', status: 'coming' },
  { id: 'c-ca', flag: '🇨🇦', name: 'Canada', currency: 'CAD', status: 'coming' },
];

export default function CountriesSection() {
  return (
    <section id="countries" className="py-24 lg:py-32 relative overflow-hidden">
      <div className="relative z-10 max-w-screen-2xl mx-auto px-6 lg:px-8 xl:px-10 2xl:px-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/30 border border-primary-light/30 text-secondary-foreground text-xs font-semibold tracking-widest uppercase mb-6">
            Présence Internationale
          </div>
          <h2 className="text-hero-lg text-foreground mb-4">
            Disponible dans{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)' }}>
              votre pays
            </span>
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg max-w-xl mx-auto">
            JDV GLOBAL CENTER s'étend progressivement à travers l'Afrique et le monde entier.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6 gap-4">
          {countries?.map((country) => (
            <div
              key={country?.id}
              className={`jdv-card flex flex-col items-center text-center gap-2 py-5 px-3 ${
                country?.status === 'coming' ? 'opacity-50' : ''
              }`}
            >
              <span className="text-3xl">{country?.flag}</span>
              <span className="text-xs font-semibold text-foreground leading-tight">{country?.name}</span>
              <span className="text-xs font-medium text-muted-foreground">{country?.currency}</span>
              {country?.status === 'coming' && (
                <span className="text-xs text-warning font-medium">Bientôt</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}