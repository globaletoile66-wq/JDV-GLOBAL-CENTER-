import LandingNav from './components/LandingNav';
import HeroSection from './components/HeroSection';
import ModulesGrid from './components/ModulesGrid';
import HowItWorks from './components/HowItWorks';
import SecuritySection from './components/SecuritySection';
import CountriesSection from './components/CountriesSection';
import LandingFooter from './components/LandingFooter';

export default function LandingHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <LandingNav />
      <main>
        <HeroSection />
        <ModulesGrid />
        <HowItWorks />
        <SecuritySection />
        <CountriesSection />
      </main>
      <LandingFooter />
    </div>
  );
}