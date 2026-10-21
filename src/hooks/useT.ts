'use client';

import { useCallback } from 'react';
import { useJDV } from '@/contexts/JDVContext';
import { translate, translateOr } from '@/lib/i18n';

/** Traduction dans la langue active de l’interface. t('clé', { n: 3 }) ; tOr('clé', 'texte de repli'). */
export function useT() {
  const { activeLanguage } = useJDV();
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(activeLanguage, key, vars), [activeLanguage]);
  const tOr = useCallback((key: string, fallback: string, vars?: Record<string, string | number>) => translateOr(activeLanguage, key, fallback, vars), [activeLanguage]);
  return { t, tOr, language: activeLanguage };
}
