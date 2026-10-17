'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { DOC_LABEL, LEVEL_LABEL, kycError, type DocType } from '@/lib/kyc/files';

type Doc = { id: string; type: DocType; path: string; status: string; submitted_at: string };
type Item = { user_id: string; email: string | null; full_name: string | null; kyc_level: string; kyc_status: string; submitted_at: string | null; documents: Doc[] };
const TABS: [string, string][] = [['under_review', 'À examiner'], ['approved', 'Validés'], ['rejected', 'Refusés']];

/** Écran des administrateurs : examen des dossiers d'identité. La base refuse tout autre accès. */
export default function KycAdminPage() {
  const sb = useMemo(() => createClient(), []);
  const [tab, setTab] = useState('under_review');
  const [items, setItems] = useState<Item[] | null>(null);
  const [denied, setDenied] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [level, setLevel] = useState('verified');
  const [years, setYears] = useState(2);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ url: string; isPdf: boolean; title: string } | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await sb.rpc('kyc_admin_queue', { p_status: tab });
    if (error) { setDenied(error.message.includes('ACCESS_DENIED')); setItems([]); } else setItems((data ?? []) as Item[]);
  }, [sb, tab]);
  useEffect(() => { setItems(null); load(); }, [load]);

  async function view(d: Doc) {
    await sb.rpc('kyc_admin_log_view', { p_document_id: d.id });                       // consultation enregistrée avant l'accès
    const { data, error } = await sb.storage.from('kyc-documents').createSignedUrl(d.path, 120);  // lien valable 2 minutes
    if (error || !data) { toast.error('Document inaccessible.'); return; }
    setPreview({ url: data.signedUrl, isPdf: d.path.endsWith('.pdf'), title: DOC_LABEL[d.type]?.title ?? d.type });
  }
  async function decide(it: Item, decision: 'approve' | 'reject') {
    if (decision === 'reject' && !reason.trim()) { toast.error('Indiquez le motif du refus.'); return; }
    if (!window.confirm(decision === 'approve' ? `Valider l’identité de ${it.full_name ?? it.email} au niveau « ${LEVEL_LABEL[level]} » ?` : 'Refuser ce dossier ?')) return;
    setBusy(true);
    const { error } = await sb.rpc('kyc_review', { p_user_id: it.user_id, p_decision: decision, p_level: level, p_notes: reason || null, p_valid_years: years });
    setBusy(false);
    if (error) toast.error(kycError(error.message)); else { toast.success(decision === 'approve' ? 'Identité validée.' : 'Dossier refusé.'); setPreview(null); setOpen(null); setReason(''); load(); }
  }

  if (denied) return <main className="p-10 text-sm text-foreground">Accès réservé aux administrateurs.</main>;
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-foreground">Vérifications d’identité</h1>
      <div role="tablist" aria-label="Statut" className="mt-4 flex gap-1 text-sm">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-3 py-1.5 ${tab === k ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground'}`}>{l}</button>)}
      </div>
      {items === null ? <p className="mt-6 text-sm text-muted-foreground">Chargement…</p> : items.length === 0 ? <p className="mt-6 text-sm text-muted-foreground">Aucun dossier.</p> : (
        <ul className="mt-4 space-y-3">
          {items.map((it) => (
            <li key={it.user_id} className="jdv-card p-4">
              <button type="button" onClick={() => setOpen(open === it.user_id ? null : it.user_id)} aria-expanded={open === it.user_id} className="flex w-full items-center justify-between text-left">
                <span><span className="block font-semibold text-foreground">{it.full_name ?? it.email}</span><span className="block text-xs text-muted-foreground">{it.email} · {it.submitted_at ? `envoyé le ${new Date(it.submitted_at).toLocaleDateString('fr-FR')}` : ''} · niveau actuel : {LEVEL_LABEL[it.kyc_level]}</span></span>
                <span aria-hidden>{open === it.user_id ? '−' : '+'}</span>
              </button>
              {open === it.user_id && (
                <div className="mt-4 space-y-4 border-t border-border pt-4">
                  <ul className="flex flex-wrap gap-2">
                    {it.documents.map((d) => <li key={d.id}><button type="button" onClick={() => view(d)} className="btn-ghost px-3 py-1.5 text-sm">Voir : {DOC_LABEL[d.type]?.title ?? d.type}</button></li>)}
                    {it.documents.length === 0 && <li className="text-xs text-muted-foreground">Aucun document en attente d’examen.</li>}
                  </ul>
                  {it.kyc_status === 'under_review' && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm"><span className="text-foreground">Niveau accordé</span>
                        <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground"><option value="basic">Basique</option><option value="verified">Vérifié</option><option value="enhanced">Renforcé</option></select></label>
                      <label className="block text-sm"><span className="text-foreground">Validité (années)</span>
                        <input type="number" min={1} max={10} value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" /></label>
                      <label className="block text-sm sm:col-span-2"><span className="text-foreground">Motif (obligatoire en cas de refus, vu par l’utilisateur)</span>
                        <input value={reason} maxLength={300} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-foreground" /></label>
                      <div className="flex gap-2 sm:col-span-2">
                        <button type="button" disabled={busy} onClick={() => decide(it, 'approve')} className="btn-primary px-4 py-2 disabled:opacity-60">Valider</button>
                        <button type="button" disabled={busy} onClick={() => decide(it, 'reject')} className="rounded-lg border border-danger px-4 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-60">Refuser</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {preview && (
        <div role="dialog" aria-label={preview.title} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreview(null)}>
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-2xl bg-card p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between"><p className="font-semibold text-foreground">{preview.title}</p><button type="button" onClick={() => setPreview(null)} className="btn-ghost px-3 py-1 text-sm">Fermer</button></div>
            {preview.isPdf ? <iframe src={preview.url} title={preview.title} className="h-[70vh] w-full rounded-lg" /> : /* eslint-disable-next-line @next/next/no-img-element */ <img src={preview.url} alt={preview.title} className="mx-auto max-h-[70vh] rounded-lg" />}
            <p className="mt-2 text-xs text-muted-foreground">Ce lien expire dans 2 minutes. Cette consultation est enregistrée.</p>
          </div>
        </div>
      )}
    </main>
  );
}
