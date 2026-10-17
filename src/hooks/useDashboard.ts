'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { DashboardData } from '@/lib/dashboard/types';

/** Charge le tableau de bord en un seul appel ; se rafraîchit au retour sur l'onglet et toutes les 2 minutes. */
export function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const refresh = useCallback(async () => {
    const { data: d, error: e } = await createClient().rpc('dashboard_overview');
    if (!alive.current) return;
    if (e) setError(e.message.includes('AUTHENTICATION_REQUIRED') ? 'AUTH' : 'Impossible de charger votre tableau de bord.');
    else { setData(d as DashboardData); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    alive.current = true; refresh();
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    const t = setInterval(refresh, 120_000);
    return () => { alive.current = false; document.removeEventListener('visibilitychange', onVisible); clearInterval(t); };
  }, [refresh]);

  return { data, error, loading, refresh };
}
