'use client';

import { createContext, useContext, useState, useCallback } from 'react';

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
  const [activeLanguage, setActiveLanguage] = useState('fr');
  const [activeCurrency, setActiveCurrency] = useState('XOF');
  const [activeCountry, setActiveCountry] = useState('BJ');
  const [activeModule, setActiveModule] = useState<string | null>(null);

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
