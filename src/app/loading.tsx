'use client';
import { useEffect, useState } from 'react';
import { POLES } from '../lib/jdv/poles';

/** Page de chargement : présente les 17 pôles pendant que l'application se charge. */
export default function Loading() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((v) => (v + 1) % POLES.length), 1800); return () => clearInterval(t); }, []);
  const p = POLES[i];
  return (
    <main className="jdv-home flex min-h-screen flex-col items-center justify-center px-6 text-center" aria-busy="true" aria-live="polite">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>JDV</div>
      <h1 className="text-2xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>JDV GLOBAL CENTER</h1>
      <p className="mt-1 text-sm text-[var(--jdv-muted)]">Votre monde, connecté</p>
      <div className="mt-10 max-w-md" key={p.id}>
        <div className="text-4xl" aria-hidden>{p.icon}</div>
        <p className="mt-2 text-lg font-semibold">{p.name}</p>
        <p className="mt-1 text-[var(--jdv-muted)]">{p.tagline}</p>
        <p className="mt-2 text-sm text-[var(--jdv-muted)]">{p.summary}</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-1.5" aria-hidden>
        {POLES.map((x, k) => <span key={x.id} className="h-2 w-2 rounded-full" style={{ background: k === i ? 'var(--jdv-accent)' : 'var(--jdv-border)' }} />)}
      </div>
      <p className="mt-6 text-sm text-[var(--jdv-muted)]">Chargement en cours…</p>
    </main>
  );
}
