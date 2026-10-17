'use client';
import { useState } from 'react';
import Link from 'next/link';
import { POLES, STATUS_LABEL, type Pole } from '../../lib/jdv/poles';

function Badge({ pole }: { pole: Pole }) {
  const live = pole.status === 'live';
  return (
    <span className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={live ? { background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' } : { background: 'var(--jdv-primary-soft)', color: 'var(--jdv-primary-text)' }}>
      {STATUS_LABEL[pole.status]}
    </span>
  );
}

export default function PolesShowcase() {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <section id="poles" aria-labelledby="poles-title" className="bg-[var(--jdv-primary-soft)] py-16">
      <div className="mx-auto max-w-6xl px-5">
        <h2 id="poles-title" className="text-center text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Nos 17 pôles, pensés pour chacun</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-[var(--jdv-muted)]">Chaque pôle regroupe des branches. Ouvrez une carte pour voir ce qu’elle fait, pour qui, et pourquoi elle est conçue ainsi.</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POLES.map((p) => {
            const open = openId === p.id;
            return (
              <li key={p.id} className="rounded-2xl border border-[var(--jdv-border)] bg-white">
                <button type="button" onClick={() => setOpenId(open ? null : p.id)} aria-expanded={open} aria-controls={`pole-${p.id}`}
                  className="flex w-full items-start gap-3 rounded-2xl p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jdv-accent)]">
                  <span className="text-3xl" aria-hidden>{p.icon}</span>
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center gap-2"><span className="font-semibold">{p.name}</span><Badge pole={p} /></span>
                    <span className="mt-1 block text-sm text-[var(--jdv-muted)]">{p.tagline}</span>
                  </span>
                  <span aria-hidden className="text-[var(--jdv-muted)]">{open ? '−' : '+'}</span>
                </button>
                {open && (
                  <div id={`pole-${p.id}`} className="border-t border-[var(--jdv-border)] px-5 pb-5 pt-4 text-sm">
                    <p>{p.summary}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--jdv-muted)]">Branches : {p.branches.join(' · ')}</p>
                    {p.statusNote && <p className="mt-1 text-xs text-[var(--jdv-muted)]">{p.statusNote}</p>}
                    <h3 className="mt-4 font-semibold">Pour qui ?</h3>
                    <ul className="mt-1 space-y-1.5">
                      {p.audiences.map((a) => <li key={a.who}><strong>{a.who}</strong> : {a.benefit}</li>)}
                    </ul>
                    <h3 className="mt-4 font-semibold">Pourquoi elle est bien pensée</h3>
                    <p className="mt-1">{p.why}</p>
                    {p.href && (
                      <Link href={p.href} className="mt-4 inline-block rounded-lg px-4 py-2 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jdv-accent)]"
                        style={{ background: 'var(--jdv-accent)', color: 'var(--jdv-on-accent)' }}>Ouvrir {p.statusNote?.replace(' est disponible', '') ?? p.name}</Link>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
