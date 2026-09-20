'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';

export default function RegisterPage() {
  const { signUp } = useAuth(); const router = useRouter();
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
  const [error,setError]=useState<string|null>(null); const [loading,setLoading]=useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); setError(null); setLoading(true);
    try { const result=await signUp(email,password); router.replace(result.session ? '/dashboard' : '/auth/login?registered=1'); }
    catch(err){ setError(err instanceof Error ? err.message : 'Inscription impossible.'); } finally { setLoading(false); }
  }
  return <main className="min-h-screen bg-background flex items-center justify-center px-4 py-10"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
    <div className="flex items-center gap-3 mb-8"><AppLogo size={44}/><div><h1 className="font-extrabold">Créer un compte</h1><p className="text-xs text-muted-foreground">JDV GLOBAL CENTER</p></div></div>
    {error && <div className="mb-5 flex gap-2 rounded-xl border border-danger/25 bg-danger/10 p-3 text-sm text-danger"><AlertCircle size={17}/>{error}</div>}
    <form onSubmit={submit} className="space-y-5"><div><label htmlFor="email" className="mb-1.5 block text-sm font-semibold">Email</label><input id="email" type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="jdv-input w-full"/></div>
    <div><label htmlFor="password" className="mb-1.5 block text-sm font-semibold">Mot de passe</label><input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="jdv-input w-full"/></div>
    <button disabled={loading} className="btn-primary w-full justify-center py-3">{loading?<Loader2 className="animate-spin" size={18}/>:<><UserPlus size={18}/>Créer mon compte</>}</button></form>
    <p className="mt-6 text-center text-sm text-muted-foreground">Déjà inscrit ? <Link href="/auth/login" className="text-accent font-semibold">Se connecter</Link></p>
  </section></main>;
}