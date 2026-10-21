'use client';

import { useEffect, useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { POLES } from '@/lib/jdv/poles';

const ROTATION_MS = 2400;

/**
 * Next.js route-level loading screen. The animation is intentionally lightweight,
 * accessible to assistive technology, and does not block navigation indefinitely.
 */
export default function Loading() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (POLES.length < 2) return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % POLES.length);
    }, ROTATION_MS);

    return () => window.clearInterval(interval);
  }, []);

  const activePole = POLES[activeIndex];

  return (
    <main
      className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#08162f] px-6 py-12 text-center text-white"
      aria-busy="true"
      aria-live="polite"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[min(80vw,42rem)] w-[min(80vw,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d9b56d]/10" />
        <div className="absolute left-1/2 top-1/2 h-[min(62vw,32rem)] w-[min(62vw,32rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d9b56d]/15" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1b4d80]/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[1.75rem] border border-[#d9b56d]/40 bg-white/[.06] p-3 shadow-[0_0_60px_rgba(217,181,109,.12)]">
          <AppLogo size={72} className="justify-center" />
        </div>

        <p className="text-xs font-bold uppercase tracking-[.34em] text-[#d9b56d]">
          Bienvenue dans votre écosystème
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-[.12em] sm:text-3xl">
          JDV GLOBAL CENTER
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
          Un monde de services, une seule plateforme.
        </p>

        <div className="mt-10 flex min-h-28 max-w-md flex-col items-center justify-center" key={activePole?.id ?? 'jdv'}>
          <span className="text-4xl" aria-hidden="true">{activePole?.icon ?? '🌍'}</span>
          <p className="mt-3 text-lg font-semibold text-white">
            {activePole?.name ?? 'Préparation de votre espace'}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {activePole?.tagline ?? 'Connexion à votre écosystème JDV'}
          </p>
          {activePole?.summary ? (
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">{activePole.summary}</p>
          ) : null}
        </div>

        <div className="mt-7 h-1.5 w-52 overflow-hidden rounded-full bg-white/10">
          <div className="jdv-loading-progress h-full rounded-full bg-gradient-to-r from-[#b98b3c] via-[#f0d38b] to-[#b98b3c]" />
        </div>
        <p className="mt-4 text-xs text-slate-400">Chargement en cours…</p>
      </div>

      <p className="absolute bottom-5 z-10 text-[11px] tracking-wide text-slate-500">
        Innovation · Confiance · Développement
      </p>

      <style jsx>{`
        .jdv-loading-progress {
          transform-origin: left;
          animation: jdv-progress 1.8s ease-in-out infinite;
        }
        @keyframes jdv-progress {
          0% { transform: translateX(-100%) scaleX(.35); }
          50% { transform: translateX(0) scaleX(.85); }
          100% { transform: translateX(120%) scaleX(.35); }
        }
        @media (prefers-reduced-motion: reduce) {
          .jdv-loading-progress { animation: none; transform: scaleX(.65); }
        }
      `}</style>
    </main>
  );
}
