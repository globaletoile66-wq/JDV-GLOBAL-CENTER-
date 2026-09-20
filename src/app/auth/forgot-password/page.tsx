'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const supabase=createClient(); const [email,setEmail]=useState(''); const [loading,setLoading]=useState(false); const [sent,setSent]=useState(false); const [error,setError]=useState<string|null>(null);
  async function submit(e:FormEvent){ e.preventDefault(); setLoading(true); setError(null); const result=await supabase.auth.resetPasswordForEmail(email,{redirectTo:typeof window!=='undefined'?window.location.origin+'/auth/reset-password':undefined}); if(result.error)setError(result.error.message);else setSent(true); setLoading(false); }
  return <main className="min-h-screen bg-background flex items-center justify-center px-4"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
    <div className="flex items-center gap-3 mb-8"><AppLogo size={44}/><div><h1 className="font-extrabold">Mot de passe oublié</h1><p className="text-xs text-muted-foreground">JDV GLOBAL CENTER</p></div></div>
    {sent ? <div className="space-y-5"><p className="text-sm text-muted-foreground">Si cette adresse est enregistrée, un lien de réinitialisation a été envoyé.</p><Link href="/auth/login" className="btn-primary w-full justify-center">Retour à la connexion</Link></div> :
    <form onSubmit={submit} className="space-y-5"><input type="email" required placeholder="votre@email.com" value={email} onChange={e=>setEmail(e.target.value)} className="jdv-input w-full"/>{error&&<p className="text-sm text-danger">{error}</p>}<button disabled={loading} className="btn-primary w-full justify-center">{loading?<Loader2 className="animate-spin" size={18}/>: 'Envoyer le lien'}</button><Link href="/auth/login" className="block text-center text-sm text-accent">Retour</Link></form>}
  </section></main>;
}