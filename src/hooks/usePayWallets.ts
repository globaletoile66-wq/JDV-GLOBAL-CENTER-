'use client';
import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { PayWallet } from '@/lib/pay/types';

export function usePayWallets() {
  const [wallets, setWallets] = useState<PayWallet[] | null>(null);
  const refresh = useCallback(async () => {
    const { data } = await createClient().from('wallets')
      .select('id,balance,available_balance,wallet_status,currency_id,currencies(code,symbol,decimal_places)')
      .is('organization_id', null).order('balance', { ascending: false });
    setWallets(((data ?? []) as unknown as PayWallet[]).sort((a, b) => (b.balance > 0 ? 1 : 0) - (a.balance > 0 ? 1 : 0) || a.currencies.code.localeCompare(b.currencies.code)));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { wallets, refresh };
}
