'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import PayHeader from '@/components/pay/PayHeader';
import { DOC_LABEL, LEVEL_LABEL, STATUS_TEXT, kycError, kycPath, validateKycFile, type DocType } from '@/lib/kyc/files';

type Status = { level: string; status: string; notes: string | null; expires_at: string | null; documents: { type: DocType; status: string; submitted_at: string }[]; missing: string[]; can_submit: boolean };
const DOC_STATE: Record<string, string> = { pending: 'Ajouté', under_review: 'En examen', approved: 'Validé', rejected: 'Refusé' };

export default function KycPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sb = useMemo(() => createClient(), []);
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => { if (!loading && !user) router.push('/auth/login?redirect=/pay/kyc'); }, [loading, user, router]);
  const load = useCallback(async () => { const { data } = await sb.rpc('kyc_my_status'); setS(data as Status); }, [sb]);
  useEffect(() => { if (user) load(); }, [user, load]);

  const editable = !!s && ['none', 'pending', 'rejected', 'expired'].includes(s.status);

  async function upload(type: DocType, file: File | undefined) {
    if (!file || !user) return;
    const err = validateKycFile(file, type);
    if (err) { toast.error(err); return; }
    setBusy(type);
    const path = kycPath(user.id, type, file.type);
    const up = await sb.storage.from('kyc-documents').upload(path, file, { contentType: file.type, upsert: false });
    if (up.error) { setBusy(null); toast.error(kycError(up.error.message)); return; }
    const { error } = await sb.rpc('kyc_register_document', { p_document_type: type, p_storage_path: path });
    setBusy(null);
    if (error) toast.error(kycError(error.message)); else { toast.success('Document ajouté.'); load(); }
  }
  async function submit() {
    setBusy('submit');
    const { error } = await sb.rpc('kyc_submit');
    setBusy(null);
    if (error) toast.error(kycError(error.message)); else { toast.success('Dossier envoyé pour examen.'); load(); }
  }

  if (!s) return <main className="mx-auto max-w-2xl px-4 py-6"><PayHeader title="Vérification d’identité" active="/pay/kyc" /><p className="text-sm text-muted-foreground">Chargement…</p></main>;
  const current = (t: DocType) => s.documents.find((d) => d.type === t);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <PayHeader title="Vérification d’identité" active="/pay/kyc" />
      <section aria-labelledby="st-title" className="jdv-card p-5">
        <h2 id="st-title" className="font-bold text-foreground">Votre statut : {STATUS_TEXT[s.status] ?? s.status}</h2>
        {s.status === 'approved' && <p className="mt-1 text-sm text-success">Niveau {LEVEL_LABEL[s.level] ?? s.level}{s.expires_at ? ` · valable jusqu’au ${new Date(s.expires_at).toLocaleDateString('fr-FR', { dateStyle: 'long' })}` : ''}. Vos plafonds sont mis à jour.</p>}
        {s.status === 'under_review' && <p className="mt-1 text-sm text-muted-foreground">Notre équipe examine votre dossier. Vous serez prévenu de la décision.</p>}
        {s.status === 'rejected' && <p role="alert" className="mt-2 rounded-lg bg-danger/10 p-3 text-sm text-danger">Dossier refusé. Motif : {s.notes}. Envoyez de nouveaux documents ci-dessous.</p>}
        {s.status === 'expired' && <p role="alert" className="mt-2 rounded-lg bg-warning/10 p-3 text-sm text-warning">Votre vérification a expiré : vos plafonds sont revenus au niveau « non vérifié ». Renvoyez vos documents pour la renouveler.</p>}
        {s.status === 'none' || s.status === 'pending' ? <p className="mt-1 text-sm text-muted-foreground">Vérifier votre identité relève vos plafonds d’envoi et protège votre compte.</p> : null}
      </section>

      <ul className="mt-6 space-y-3" aria-label="Documents">
        {(Object.keys(DOC_LABEL) as DocType[]).map((t) => {
          const d = current(t); const def = DOC_LABEL[t];
          return (
            <li key={t} className="jdv-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div><p className="font-medium text-foreground">{def.title} {def.required ? <span className="text-xs text-accent">obligatoire</span> : <span className="text-xs text-muted-foreground">facultatif</span>}</p>
                  <p className="text-xs text-muted-foreground">{def.hint}</p></div>
                {d && <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground">{DOC_STATE[d.status] ?? d.status}</span>}
              </div>
              {editable && (
                <div className="mt-3">
                  <input ref={(el) => { inputs.current[t] = el; }} type="file" className="sr-only" id={`f-${t}`} accept={def.imageOnly ? 'image/jpeg,image/png,image/webp' : 'image/jpeg,image/png,image/webp,application/pdf'}
                    onChange={(e) => { upload(t, e.target.files?.[0]); e.target.value = ''; }} />
                  <label htmlFor={`f-${t}`} className={`btn-ghost inline-block cursor-pointer px-4 py-2 text-sm ${busy ? 'pointer-events-none opacity-60' : ''}`}>{busy === t ? 'Envoi…' : d ? 'Remplacer' : 'Choisir un fichier'}</label>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {editable && (
        <div className="jdv-card mt-6 p-5">
          <button type="button" onClick={submit} disabled={!s.can_submit || busy === 'submit'} className="btn-primary w-full px-4 py-2.5 disabled:opacity-50">{busy === 'submit' ? 'Envoi…' : 'Envoyer mon dossier'}</button>
          {!s.can_submit && s.missing.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Il manque : {s.missing.map((m) => DOC_LABEL[m as DocType]?.title.toLowerCase() ?? m).join(', ')}.</p>}
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">Vos documents sont stockés dans un espace privé : seuls vous et les administrateurs habilités chargés de la vérification peuvent les consulter, et chaque consultation est enregistrée. Formats JPG, PNG, WebP ou PDF, 5 Mo maximum par fichier.</p>
    </main>
  );
}
