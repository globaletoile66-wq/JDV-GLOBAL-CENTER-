'use client';

import Link from 'next/link';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type InviteInfo = {
  name: string;
  description: string | null;
  contribution_amount: number;
  currency: string | null;
  frequency: string;
  cycle_periods: number;
  late_fee_amount: number;
  member_limit: number;
  members: number;
  president_name: string | null;
  rules: unknown;
  rules_version: string;
  already_member: boolean;
  phone_confirmed: boolean;
  expires_at: string | null;
};

const frequencyLabels: Record<string, string> = {
  daily: 'Quotidienne',
  weekly: 'Hebdomadaire',
  biweekly: 'Toutes les deux semaines',
  monthly: 'Mensuelle',
  quarterly: 'Trimestrielle',
};

export default function TontineJoinPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [busy, setBusy] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [acceptRules, setAcceptRules] = useState(false);
  const [acceptContract, setAcceptContract] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (authLoading) return;
      if (!user || !token) {
        setBusy(false);
        return;
      }
      setBusy(true);
      setError('');
      const result = await supabase.rpc('tontine_invite_info', { p_join_token: token });
      if (cancelled) return;
      if (result.error) {
        setError('Invitation indisponible : ' + result.error.message);
        setInfo(null);
      } else {
        setInfo(result.data as InviteInfo);
      }
      setBusy(false);
    }
    void load();
    return () => { cancelled = true; };
  }, [authLoading, supabase, token, user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!acceptRules || !acceptContract) {
      setError('Tu dois accepter séparément les règles et le contrat de participation.');
      return;
    }
    setSubmitting(true);
    const result = await supabase.rpc('tontine_join_by_link', {
      p_join_token: token,
      p_accept_rules: acceptRules,
      p_accept_contract: acceptContract,
    });
    setSubmitting(false);
    if (result.error) {
      setError('La demande n’a pas été enregistrée : ' + result.error.message);
      return;
    }
    setSuccess('Demande enregistrée. Ton adhésion reste en attente : le téléphone confirmé ne vaut pas vérification d’identité. Un responsable doit vérifier le dossier KYC et les validations contractuelles avant toute activation.');
    setInfo((current) => current ? { ...current, already_member: true } : current);
  }

  if (authLoading || busy) {
    return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white"><LoaderCircle className="animate-spin" /></main>;
  }

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
    <div className="mx-auto max-w-3xl">
      <Link href="/tontine" className="text-sm text-white/60 hover:text-white">← Retour à JDV Tontine</Link>
      <header className="mt-6 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-[#F28C28]/10 p-3 text-[#F28C28]"><ShieldCheck size={25}/></div>
          <div><p className="text-xs font-bold uppercase tracking-[.22em] text-[#F28C28]">Invitation de groupe</p><h1 className="mt-2 text-3xl font-black">Rejoindre une tontine</h1><p className="mt-2 text-sm leading-6 text-white/60">L’acceptation de l’invitation crée une demande en attente, jamais une activation automatique.</p></div>
        </div>
      </header>

      {!user ? <section className="mt-6 rounded-2xl border border-white/10 p-6">
        <h2 className="font-bold">Connexion requise</h2>
        <p className="mt-2 text-sm text-white/60">Connecte-toi pour vérifier l’invitation et déposer ta demande.</p>
        <Link className="mt-4 inline-block rounded-xl bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]" href={`/auth/login?next=${encodeURIComponent(`/tontine/join/${token}`)}`}>Se connecter</Link>
      </section> : error && !info ? <div role="alert" className="mt-6 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div> : info ? <>
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-6">
          <h2 className="text-2xl font-bold">{info.name}</h2>
          {info.description && <p className="mt-2 text-sm text-white/60">{info.description}</p>}
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-xs text-white/40">Cotisation par période</dt><dd className="mt-1 font-semibold">{info.contribution_amount} {info.currency ?? ''}</dd></div>
            <div><dt className="text-xs text-white/40">Fréquence</dt><dd className="mt-1 font-semibold">{frequencyLabels[info.frequency] ?? info.frequency}</dd></div>
            <div><dt className="text-xs text-white/40">Nombre de périodes</dt><dd className="mt-1 font-semibold">{info.cycle_periods}</dd></div>
            <div><dt className="text-xs text-white/40">Version des règles / contrat</dt><dd className="mt-1 font-semibold">{info.rules_version}</dd></div>
          </dl>
          {info.rules !== null && info.rules !== undefined ? <details className="mt-5 rounded-xl border border-white/10 p-4"><summary className="cursor-pointer text-sm font-semibold">Lire les règles de la tontine</summary><pre className="mt-3 whitespace-pre-wrap break-words text-xs leading-5 text-white/70">{typeof info.rules === 'string' ? info.rules : JSON.stringify(info.rules, null, 2)}</pre></details> : null}
          <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200/20 bg-amber-300/5 p-4 text-sm leading-6 text-amber-100/80"><AlertCircle size={18} className="mt-1 shrink-0"/> Le numéro confirmé sert uniquement à vérifier le contrôle du téléphone. L’identité devra être vérifiée avec un document approuvé avant activation.</div>
        </section>

        {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
        {success ? <div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100"><div className="flex gap-3"><CheckCircle2 size={20} className="mt-0.5 shrink-0"/>{success}</div><Link href="/tontine/documents" className="mt-4 inline-flex rounded-lg bg-[#F28C28] px-4 py-2 font-bold text-[#0B1B3D]">Continuer vers les documents et l’identité</Link></div> : info.already_member ? <div className="mt-5 rounded-xl border border-white/10 p-4 text-sm text-white/70">Une adhésion ou une demande existe déjà pour ton compte.</div> : <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-6">
          <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" required checked={acceptRules} onChange={(event) => setAcceptRules(event.target.checked)} className="mt-1 accent-orange-400"/><span>J’ai lu et j’accepte les règles de cette tontine, version {info.rules_version}.</span></label>
          <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" required checked={acceptContract} onChange={(event) => setAcceptContract(event.target.checked)} className="mt-1 accent-orange-400"/><span>J’accepte le contrat de participation correspondant à la version {info.rules_version} et comprends que l’adhésion reste en attente de vérification.</span></label>
          <button type="submit" disabled={submitting || !info.phone_confirmed} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{submitting ? <LoaderCircle size={18} className="animate-spin"/> : <ShieldCheck size={18}/>} {submitting ? 'Enregistrement…' : 'Envoyer ma demande d’adhésion'}</button>
          {!info.phone_confirmed && <p className="text-sm text-amber-200">Le téléphone du compte doit être confirmé avant l’envoi.</p>}
        </form>}
      </> : <div className="mt-6 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Invitation introuvable ou expirée.</div>}
    </div>
  </main>;
}
