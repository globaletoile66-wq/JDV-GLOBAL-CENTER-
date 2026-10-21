'use client';

import { useEffect, useState } from 'react';
import AppLogo from '@/components/ui/AppLogo';
import { POLES } from '@/lib/jdv/poles';

const ROTATION_MS = 2800;

/**
 * Route-level loading screen: lightweight, responsive and respectful of reduced motion.
 * It never pretends to show a numeric completion percentage while navigation is pending.
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
      className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#07142b] px-5 py-12 text-center text-white sm:px-8"
      aria-busy="true"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_38%,rgba(28,75,126,.34),transparent_58%)]" />
        <div className="jdv-orbit absolute left-1/2 top-[42%] h-[min(88vw,44rem)] w-[min(88vw,44rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d9b56d]/10" />
        <div className="jdv-orbit-reverse absolute left-1/2 top-[42%] h-[min(68vw,34rem)] w-[min(68vw,34rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[#d9b56d]/15" />
        <div className="absolute left-1/2 top-[42%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1b4d80]/25 blur-3xl sm:h-80 sm:w-80" />
        <span className="jdv-star absolute left-[18%] top-[28%] h-1.5 w-1.5 rounded-full bg-[#f0d38b]" />
        <span className="jdv-star jdv-star-delay absolute right-[19%] top-[55%] h-1 w-1 rounded-full bg-white/80" />
        <span className="jdv-star jdv-star-delay-2 absolute bottom-[24%] left-[28%] h-1 w-1 rounded-full bg-[#d9b56d]" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center">
        <div className="jdv-logo-shell relative mb-7 flex h-28 w-28 items-center justify-center rounded-[2rem] border border-[#d9b56d]/45 bg-[#0d2040]/90 p-3 shadow-[0_0_70px_rgba(217,181,109,.14)] sm:h-32 sm:w-32">
          <div aria-hidden="true" className="absolute inset-1 rounded-[1.65rem] border border-white/[.07]" />
          <AppLogo size={88} className="relative justify-center" />
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[.32em] text-[#e3c47e] sm:text-xs sm:tracking-[.4em]">
          Bienvenue dans votre écosystème
        </p>
        <h1 className="mt-3 text-2xl font-black tracking-[.09em] sm:text-4xl sm:tracking-[.14em]">
          JDV GLOBAL CENTER
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300 sm:text-base">
          Un monde de services, une seule plateforme.
        </p>

        <div
          key={activePole?.id ?? 'jdv'}
          className="jdv-pole-enter mt-9 flex min-h-36 w-full max-w-md flex-col items-center justify-center rounded-2xl border border-white/[.08] bg-white/[.035] px-5 py-5 backdrop-blur-sm sm:mt-11"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="text-4xl drop-shadow-sm" aria-hidden="true">{activePole?.icon ?? '🌍'}</span>
          <p className="mt-3 text-base font-semibold text-white sm:text-lg">
            {activePole?.name ?? 'Préparation de votre espace'}
          </p>
          <p className="mt-1 text-sm text-slate-300">
            {activePole?.tagline ?? 'Connexion à votre écosystème JDV'}
          </p>
          {activePole?.summary ? (
            <p className="mt-2 max-w-sm text-xs leading-5 text-slate-400">{activePole.summary}</p>
          ) : null}
        </div>

        <div className="mt-7 flex items-center gap-2" aria-hidden="true">
          {POLES.map((pole, index) => (
            <span
              key={pole.id}
              className={`h-1.5 rounded-full transition-all duration-500 ${index === activeIndex ? 'w-7 bg-[#e3c47e]' : 'w-1.5 bg-white/25'}`}
            />
          ))}
        </div>

        <div
          className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-white/10 sm:w-56"
          role="progressbar"
          aria-label="Chargement de JDV Global Center"
        >
          <div className="jdv-loading-progress h-full rounded-full bg-gradient-to-r from-[#b98b3c] via-[#f0d38b] to-[#b98b3c]" />
        </div>
        <p className="mt-4 text-xs text-slate-400">Préparation de votre espace…</p>
      </div>

      <p className="absolute bottom-5 z-10 px-4 text-[10px] tracking-[.18em] text-slate-500 sm:text-[11px] sm:tracking-[.25em]">
        INNOVATION <span className="mx-1 text-[#d9b56d]">·</span> CONFIANCE <span className="mx-1 text-[#d9b56d]">·</span> DÉVELOPPEMENT
      </p>

      <style jsx>{`
        .jdv-logo-shell { animation: jdv-logo-breathe 3.2s ease-in-out infinite; }
        .jdv-orbit { animation: jdv-orbit 28s linear infinite; }
        .jdv-orbit-reverse { animation: jdv-orbit 38s linear infinite reverse; }
        .jdv-star { animation: jdv-star-pulse 2.4s ease-in-out infinite; }
        .jdv-star-delay { animation-delay: .8s; }
        .jdv-star-delay-2 { animation-delay: 1.5s; }
        .jdv-pole-enter { animation: jdv-pole-enter .45s ease-out both; }
        .jdv-loading-progress {
          transform-origin: left;
          animation: jdv-progress 1.9s ease-in-out infinite;
        }
        @keyframes jdv-logo-breathe {
          0%, 100% { box-shadow: 0 0 36px rgba(217,181,109,.09); }
          50% { box-shadow: 0 0 70px rgba(217,181,109,.2); }
        }
        @keyframes jdv-orbit { to { transform: translate(-50%, -50%) rotate(360deg); } }
        @keyframes jdv-star-pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
        @keyframes jdv-pole-enter {
          from { opacity: 0; transform: translateY(7px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes jdv-progress {
          0% { transform: translateX(-100%) scaleX(.35); }
          50% { transform: translateX(0) scaleX(.85); }
          100% { transform: translateX(120%) scaleX(.35); }
        }
        @media (prefers-reduced-motion: reduce) {
          .jdv-logo-shell, .jdv-orbit, .jdv-orbit-reverse, .jdv-star, .jdv-pole-enter { animation: none; }
          .jdv-loading-progress { animation: none; transform: scaleX(.65); }
        }
      `}</style>
    </main>
  );
}
