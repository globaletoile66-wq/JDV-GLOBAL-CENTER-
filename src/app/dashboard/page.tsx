'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function DashboardRouter() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (isSuperAdmin) {
      router.replace('/hidden-concepteur-gate/dashboard');
      return;
    }
    (async () => {
      const { data } = await supabase.from('prospecteurs')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle();
      router.replace(data ? '/prospecteur' : '/business');
    })();
  }, [loading, user, isSuperAdmin, router]);

  return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><Loader2 className="animate-spin" /></div>;
}
