export default function BrandSection() {
  const pillars = [
    { icon: '🧭', title: 'Un hub central', text: 'JDV GLOBAL CENTER est le point d’entrée principal de l’écosystème Joie de Vivre : un seul endroit pour accéder à toutes les branches.' },
    { icon: '🧩', title: 'Des branches spécialisées', text: 'Chaque branche conserve ses propres fonctions et son propre espace, sans se substituer à l’accueil central.' },
    { icon: '🌱', title: 'Une plateforme qui évolue', text: 'Nouveaux pays, nouvelles langues, nouvelles devises et nouveaux services peuvent être ajoutés sans tout reconstruire.' },
  ];
  return (
    <section id="identite" aria-labelledby="identite-title" className="mx-auto max-w-6xl px-5 py-16">
      <h2 id="identite-title" className="text-center text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Qui sommes-nous ?</h2>
      <p className="mx-auto mt-3 max-w-3xl text-center text-[var(--jdv-muted)]">JDV GLOBAL CENTER, « Votre monde, connecté », est une plateforme numérique panafricaine qui réunit 17 pôles d’activité dans un écosystème intégré, simple et sécurisé.</p>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {pillars.map((p) => (
          <li key={p.title} className="rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
            <div className="text-3xl" aria-hidden>{p.icon}</div>
            <h3 className="mt-3 text-lg font-semibold">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--jdv-muted)]">{p.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
