'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AcademyNavigation from '@/components/academy/AcademyNavigation';
import { useParams } from 'next/navigation';
import { ArrowLeft, BadgeCheck, ShieldCheck, XCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Verification = {
  verified: boolean;
  reason?: string;
  certificate_code?: string;
  learner_name?: string;
  course_title?: string;
  issued_at?: string;
  status?: string;
};

export default function AcademyCertificateVerificationPage() {
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code || '');
  const supabase = createClient();
  const [result, setResult] = useState<Verification | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      setBusy(true);
      setError('');
      const { data, error: verifyError } = await supabase.rpc('academy_verify_certificate', {
        p_certificate_code: code,
      });
      if (cancelled) return;
      if (verifyError) setError('La vérification est momentanément indisponible.');
      else setResult((data || null) as Verification | null);
      setBusy(false);
    };
    if (code) void verify();
    else { setResult({ verified: false, reason: 'invalid_code' }); setBusy(false); }
    return () => { cancelled = true; };
  }, [code, supabase]);

  return (
    <main className="min-h-screen bg-[#0B1B3D] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-3xl">
        <AcademyNavigation />
        <Link href="/academy" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> JDV Academy</Link>
        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[.04] p-6 shadow-2xl sm:p-10">
          <div className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER · CERTIFICATION</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">Vérification d’attestation</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Cette page vérifie directement le registre officiel des attestations JDV Academy. Seules les informations strictement nécessaires à la vérification sont affichées.</p>
          {busy ? (
            <div className="mt-8 rounded-2xl border border-white/10 p-6 text-sm text-white/60">Vérification du code…</div>
          ) : error ? (
            <div className="mt-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5 text-sm text-amber-100">{error}</div>
          ) : result?.verified ? (
            <div className="mt-8 rounded-2xl border border-emerald-300/20 bg-emerald-300/[.06] p-5 sm:p-7">
              <div className="flex items-center gap-3 text-emerald-100"><BadgeCheck size={28}/><div><p className="font-bold">Attestation authentique</p><p className="text-xs text-emerald-100/70">Code retrouvé dans le registre JDV Academy</p></div></div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div><dt className="text-xs text-white/45">Titulaire</dt><dd className="mt-1 text-lg font-semibold">{result.learner_name}</dd></div>
                <div><dt className="text-xs text-white/45">Formation</dt><dd className="mt-1 text-lg font-semibold">{result.course_title}</dd></div>
                <div><dt className="text-xs text-white/45">Code d’attestation</dt><dd className="mt-1 break-all font-mono text-sm">{result.certificate_code}</dd></div>
                <div><dt className="text-xs text-white/45">Date de délivrance</dt><dd className="mt-1 text-sm">{result.issued_at ? new Date(result.issued_at).toLocaleDateString('fr-FR') : '—'}</dd></div>
              </dl>
              <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-4 text-xs text-emerald-100/70"><ShieldCheck size={15}/> Statut officiel : actif</div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-rose-300/20 bg-rose-300/[.06] p-5 sm:p-7">
              <div className="flex items-center gap-3 text-rose-100"><XCircle size={27}/><div><p className="font-bold">{result?.reason === 'revoked' ? 'Attestation révoquée' : 'Attestation non vérifiée'}</p><p className="mt-1 text-sm text-rose-100/70">{result?.reason === 'revoked' ? 'Cette attestation n’est plus valide.' : result?.reason === 'invalid_code' ? 'Le code fourni est vide ou invalide.' : 'Aucune attestation active ne correspond à ce code.'}</p></div></div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
