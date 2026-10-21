'use client';

import { Languages } from 'lucide-react';
import { useJDV } from '@/contexts/JDVContext';
import { useT } from '@/hooks/useT';

// Noms écrits dans leur propre langue : chacun reconnaît la sienne quelle que soit la langue active.
const LANGUAGES: { code: string; label: string }[] = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
  { code: 'es', label: 'Español' },
  { code: 'ar', label: 'العربية' },
];

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { activeLanguage, setActiveLanguage } = useJDV();
  const { t } = useT();
  return (
    <label className={`inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-2 text-sm ${className}`}>
      <Languages size={15} aria-hidden="true" />
      <span className="sr-only">{t('lang.label')}</span>
      <select
        value={activeLanguage}
        onChange={(event) => setActiveLanguage(event.target.value)}
        className="bg-transparent text-sm outline-none"
        aria-label={t('lang.label')}
      >
        {LANGUAGES.map((language) => (
          <option key={language.code} value={language.code} className="text-black">{language.label}</option>
        ))}
      </select>
    </label>
  );
}
