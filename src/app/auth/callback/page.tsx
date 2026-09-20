'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallbackPage(){
 const router=useRouter(); const supabase=createClient();
 useEffect(()=>{supabase.auth.getSession().then(({data})=>router.replace(data.session?'/dashboard':'/auth/login'));},[router,supabase]);
 return <main className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Finalisation de la connexion…</main>;
}