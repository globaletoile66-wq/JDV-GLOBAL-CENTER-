'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardRouter() {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

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
    router.replace('/business');
  }, [loading, user, isSuperAdmin, router]);

  return <div className="min-h-screen flex items-center justify-center bg-background text-foreground"><Loader2 className="animate-spin" /></div>;
}
