import { FEATURES } from '../../lib/jdv/features';
import { STATUS_LABEL } from '../../lib/jdv/poles';

export default function FeaturesSection() {
  return (
    <section id="fonctionnalites" aria-labelledby="feat-title" className="bg-[var(--jdv-primary-soft)] py-16">
      <div className="mx-auto max-w-6xl px-5">
        <h2 id="feat-title" className="text-center text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Fonctionnalités</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--jdv-muted)]">Ce que la plateforme fait pour vous, avec l’état réel de chaque fonction.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-2xl border border-[var(--jdv-border)] bg-white p-5">
              <div className="text-3xl" aria-hidden>{f.icon}</div>
              <h3 className="mt-2 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-[var(--jdv-muted)]">{f.text}</p>
              <span className="mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={f.status === 'live' ? { background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' } : { background: 'var(--jdv-primary-soft)', color: 'var(--jdv-primary-text)' }}>{STATUS_LABEL[f.status]}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
