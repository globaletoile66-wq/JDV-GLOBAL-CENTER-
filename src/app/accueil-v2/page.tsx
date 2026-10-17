// Accueil JDV GLOBAL CENTER (fond blanc, thème personnalisable). Remplace app/page.tsx : sauvegardez l'ancien avant.
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import ThemePalette from '@/components/theme/ThemePalette';
import BrandSection from '@/components/home/BrandSection';
import WhyJdv from '@/components/home/WhyJdv';
import FeaturesSection from '@/components/home/FeaturesSection';
import PolesShowcase from '@/components/home/PolesShowcase';
import PricingSection from '@/components/home/PricingSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import ContactSection from '@/components/home/ContactSection';
import AssistantWidget from '@/components/home/AssistantWidget';

export default function HomePage() {
  return (
    <ThemeProvider>
      <div className="jdv-home min-h-screen">
        <header className="sticky top-0 z-40 border-b border-[var(--jdv-border)] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold" style={{ color: 'var(--jdv-primary-text)' }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg text-sm" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>JDV</span>
              <span className="hidden sm:inline">GLOBAL CENTER</span>
            </Link>
            <nav aria-label="Principal" className="hidden gap-5 text-sm lg:flex">
              <a href="#identite" className="hover:underline">À propos</a>
              <a href="#fonctionnalites" className="hover:underline">Fonctionnalités</a>
              <a href="#poles" className="hover:underline">Services</a>
              <a href="#tarifs" className="hover:underline">Tarifs</a>
              <a href="#avis" className="hover:underline">Témoignages</a>
              <a href="#contact" className="hover:underline">Contact</a>
            </nav>
            <ThemePalette />
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-4xl px-5 py-20 text-center">
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl" style={{ color: 'var(--jdv-primary-text)' }}>JDV GLOBAL CENTER</h1>
            <p className="mt-2 text-xl font-medium" style={{ color: 'var(--jdv-accent)' }}>Votre monde, connecté</p>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-[var(--jdv-muted)]">Un seul espace pour vos paiements, votre activité, vos voyages, votre santé et bien plus. Choisissez la branche qui vous concerne : tout est relié, tout reste simple.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="#poles" className="rounded-lg px-5 py-3 font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jdv-accent)]" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>Découvrir les services</a>
              <Link href="/crm" className="rounded-lg border border-[var(--jdv-border)] px-5 py-3 font-medium hover:bg-[var(--jdv-primary-soft)]">Ouvrir JDV CRM</Link>
            </div>
          </section>

          <BrandSection />
          <WhyJdv />
          <FeaturesSection />
          <PolesShowcase />
          <PricingSection />
          <ReviewsSection />
          <ContactSection />
        </main>

        <footer className="border-t border-[var(--jdv-border)] py-8 text-center text-sm text-[var(--jdv-muted)]">
          © {new Date().getFullYear()} JDV GLOBAL CENTER · <Link href="/legal" className="underline">Mentions légales</Link>
        </footer>
        <AssistantWidget />
      </div>
    </ThemeProvider>
  );
}
