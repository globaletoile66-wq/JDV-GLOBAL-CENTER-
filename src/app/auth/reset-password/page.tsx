'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage(){
 const supabase=createClient(); const router=useRouter(); const [password,setPassword]=useState(''); const [error,setError]=useState<string|null>(null); const [done,setDone]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setError(null);const {error}=await supabase.auth.updateUser({password});if(error)setError(error.message);else{setDone(true);setTimeout(()=>router.replace('/dashboard'),800);}}
 return <main className="min-h-screen bg-background flex items-center justify-center px-4"><section className="w-full max-w-md rounded-2xl border border-border bg-card p-6"><h1 className="text-2xl font-extrabold mb-6">Nouveau mot de passe</h1>{done?<p className="text-success">Mot de passe mis à jour.</p>:<form onSubmit={submit} className="space-y-5"><input type="password" required minLength={8} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="jdv-input w-full"/>{error&&<p className="text-danger text-sm">{error}</p>}<button className="btn-primary w-full justify-center">Enregistrer</button></form>}</section></main>;
}