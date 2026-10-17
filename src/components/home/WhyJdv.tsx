import { WHY_JDV } from '../../lib/jdv/poles';

export default function WhyJdv() {
  return (
    <section id="pourquoi" aria-labelledby="why-title" className="mx-auto max-w-6xl px-5 py-16">
      <h2 id="why-title" className="text-center text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Pourquoi choisir JDV GLOBAL ?</h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--jdv-muted)]">Parce que vos activités, vos paiements et vos démarches méritent un seul endroit, clair, sûr et à votre image.</p>
      <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_JDV.map((w) => (
          <li key={w.title} className="rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
            <div className="text-3xl" aria-hidden>{w.icon}</div>
            <h3 className="mt-3 text-lg font-semibold">{w.title}{w.soon && <span className="ml-2 rounded-full bg-[var(--jdv-accent-soft)] px-2 py-0.5 text-xs font-medium">en cours</span>}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--jdv-muted)]">{w.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
