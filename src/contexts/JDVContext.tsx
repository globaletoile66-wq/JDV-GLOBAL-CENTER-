'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface JDVContextType {
  activeOrganizationId: string | null;
  activeOrganizationName: string | null;
  activeLanguage: string;
  activeCurrency: string;
  activeCountry: string;
  activeModule: string | null;
  setActiveOrganization: (id: string | null, name: string | null) => void;
  setActiveLanguage: (lang: string) => void;
  setActiveCurrency: (currency: string) => void;
  setActiveCountry: (country: string) => void;
  setActiveModule: (module: string | null) => void;
}

const JDVContext = createContext<JDVContextType | null>(null);

export const useJDV = () => {
  const context = useContext(JDVContext);
  if (!context) throw new Error('useJDV must be used within JDVProvider');
  return context;
};

export const JDVProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeOrganizationId, setActiveOrgId] = useState<string | null>(null);
  const [activeOrganizationName, setActiveOrgName] = useState<string | null>(null);
  const [activeLanguage, setActiveLanguageState] = useState('fr');
  const [activeCurrency, setActiveCurrency] = useState('XOF');
  const [activeCountry, setActiveCountry] = useState('BJ');
  const [activeModule, setActiveModule] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('jdv-language-v1');
      if (stored && ['fr', 'en', 'pt', 'es', 'ar'].includes(stored)) setActiveLanguageState(stored);
    } catch { /* Le stockage local peut être indisponible. */ }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLanguage;
      document.documentElement.dir = activeLanguage === 'ar' ? 'rtl' : 'ltr';
    }
  }, [activeLanguage]);

  const setActiveLanguage = useCallback((lang: string) => {
    const allowed = ['fr', 'en', 'pt', 'es', 'ar'];
    if (!allowed.includes(lang)) return;
    setActiveLanguageState(lang);
    try { window.localStorage.setItem('jdv-language-v1', lang); } catch { /* Préférence non persistée si stockage indisponible. */ }
  }, []);

  const setActiveOrganization = useCallback((id: string | null, name: string | null) => {
    setActiveOrgId(id);
    setActiveOrgName(name);
  }, []);

  return (
    <JDVContext.Provider value={{
      activeOrganizationId,
      activeOrganizationName,
      activeLanguage,
      activeCurrency,
      activeCountry,
      activeModule,
      setActiveOrganization,
      setActiveLanguage,
      setActiveCurrency,
      setActiveCountry,
      setActiveModule,
    }}>
      {children}
    </JDVContext.Provider>
  );
};
