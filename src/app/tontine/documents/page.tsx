'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, Upload, Users, ShieldCheck, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Tontine = { id: string; name: string; tontine_class: string; tontine_type: string };
type TontineClass = { code: string; name: string; description: string };
type BoardRow = { function_title: string; full_name: string; phone: string };
const BUCKET = 'jdv-tontine-private';
const DOC_KINDS = [
  ['creation_form', 'Fiche de création signée'],
  ['signed_contract', 'Contrat / règlement signé'],
  ['organization_bylaws', 'Statuts de l’organisation'],
  ['other', 'Autre document de l’organisation'],
] as const;
const CLASS_NAMES: Record<string, string> = {
  rotating_classic: 'Tontine rotative classique',
  target_savings: 'Épargne à objectif',
  solidarity: 'Tontine de solidarité',
  commercial_professional: 'Tontine commerciale ou professionnelle',
  flexible_contributions: 'Tontine à cotisations flexibles',
  custom: 'Tontine personnalisée',
};

export default function TontineDocumentsPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [classes, setClasses] = useState<TontineClass[]>([]);
  const [selected, setSelected] = useState('');
  const [board, setBoard] = useState<BoardRow[]>([
    { function_title: 'Président(e)', full_name: '', phone: '' },
    { function_title: 'Secrétaire', full_name: '', phone: '' },
    { function_title: 'Trésorier(ère)', full_name: '', phone: '' },
  ]);
  const [docKind, setDocKind] = useState<(typeof DOC_KINDS)[number][0]>('creation_form');
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState<'beneficiary' | 'witness_1' | 'witness_2'>('beneficiary');
  const [party, setParty] = useState({ full_name: '', phone: '', country_code: 'BJ', identity_document_type: 'Carte nationale d’identité', identity_document_number_masked: '' });
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    const [memberResult, classResult] = await Promise.all([
      (supabase as any).from('tontine_members').select('tontine_id,tontines!inner(id,name,tontine_class,tontine_type)').eq('user_id', user.id).in('membership_status', ['active', 'pending']).limit(200),
      (supabase as any).from('tontine_classes').select('code,name,description').eq('is_active', true).order('name'),
    ]);
    if (memberResult.error) setError(memberResult.error.message);
    else {
      const rows = (memberResult.data ?? []).map((row: any) => row.tontines).filter(Boolean) as Tontine[];
      const unique = Array.from(new Map(rows.map((row) => [row.id, row])).values());
      setTontines(unique);
      setSelected((current) => current || unique[0]?.id || '');
    }
    if (classResult.error) setError((current) => current || classResult.error!.message);
    else setClasses((classResult.data ?? []) as TontineClass[]);
  }, [supabase, user]);

  useEffect(() => { if (!loading && user) void load(); }, [loading, user, load]);

  async function uploadPrivateDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !selected || !file) return;
    setBusy(true); setError(''); setNotice('');
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
      setError('Choisis un PDF, JPG, PNG ou WEBP de 15 Mo maximum.');
      setBusy(false); return;
    }
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = selected + '/' + user.id + '/' + crypto.randomUUID() + '_' + safeName;
    const uploaded = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
    if (uploaded.error) {
      setError('Téléversement refusé : ' + uploaded.error.message);
      setBusy(false); return;
    }
    const saved = await (supabase as any).from('tontine_documents').insert({
      tontine_id: selected, document_kind: docKind, storage_path: path, original_filename: file.name,
      mime_type: file.type, file_size_bytes: file.size, uploaded_by: user.id, status: 'submitted',
    });
    if (saved.error) {
      setError('Le fichier a été envoyé dans le stockage privé mais son registre n’a pas été créé : ' + saved.error.message + '. Contacte le support avant de renvoyer le même fichier.');
    } else {
      setNotice('Document envoyé dans l’espace privé. Il reste à vérifier par un responsable autorisé.');
      setFile(null);
      const input = document.getElementById('tontine-document-file') as HTMLInputElement | null;
      if (input) input.value = '';
    }
    setBusy(false);
  }

  async function saveBoard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !selected) return;
    const entries = board.filter((row) => row.full_name.trim());
    if (!entries.length) { setError('Saisis au moins le nom complet du président.'); return; }
    setBusy(true); setError(''); setNotice('');
    const result = await (supabase as any).from('tontine_organization_board').insert(entries.map((row) => ({
      tontine_id: selected, function_title: row.function_title, full_name: row.full_name.trim(),
      phone: row.phone.trim() || null, created_by: user.id, status: 'pending',
    })));
    if (result.error) setError('Enregistrement du bureau refusé : ' + result.error.message);
    else setNotice('Composition du bureau enregistrée. Les fonctions restent en attente de vérification.');
    setBusy(false);
  }

  async function submitParty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !selected) return;
    if (!identityFile) { setError('Ajoute le scan du document d’identité.'); return; }
    if (!['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].includes(identityFile.type) || identityFile.size > 15 * 1024 * 1024) {
      setError('Le justificatif doit être un PDF, JPG, PNG ou WEBP de 15 Mo maximum.'); return;
    }
    setBusy(true); setError(''); setNotice('');
    const safeName = identityFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = selected + '/' + user.id + '/identity-' + role + '-' + crypto.randomUUID() + '_' + safeName;
    const uploaded = await supabase.storage.from(BUCKET).upload(path, identityFile, { contentType: identityFile.type, upsert: false });
    if (uploaded.error) { setError('Téléversement privé impossible : ' + uploaded.error.message); setBusy(false); return; }
    const result = await (supabase as any).from('tontine_party_verifications').insert({
      tontine_id: selected, party_role: role, user_id: user.id, full_name: party.full_name.trim(), phone: party.phone.trim(),
      country_code: party.country_code, identity_document_type: party.identity_document_type,
      identity_document_number_masked: party.identity_document_number_masked.trim() || null,
      identity_document_path: path, identity_status: 'submitted', phone_status: 'pending', consented_at: new Date().toISOString(),
    });
    if (result.error) setError('La pièce a été déposée en privé mais la demande n’a pas été enregistrée : ' + result.error.message);
    else { setNotice('Dossier transmis pour vérification. Le statut « soumis » ne signifie pas que l’identité ou le numéro a déjà été vérifié.'); setParty({ full_name: '', phone: '', country_code: 'BJ', identity_document_type: 'Carte nationale d’identité', identity_document_number_masked: '' }); setIdentityFile(null); }
    setBusy(false);
  }

  if (loading) return <main className="grid min-h-screen place-items-center bg-[#0B1B3D] text-white">Chargement…</main>;
  if (!user) return <main className="min-h-screen bg-[#0B1B3D] p-8 text-white"><div className="mx-auto max-w-xl rounded-2xl border border-white/10 p-6"><h1 className="text-2xl font-bold">Connexion requise</h1><p className="mt-3 text-white/60">Connecte-toi pour gérer les documents privés d’une tontine.</p><Link className="mt-5 inline-block underline" href="/auth/login?next=/tontine/documents">Se connecter</Link></div></main>;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
    <div className="mx-auto max-w-6xl">
      <Link href="/tontine" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour à JDV Tontine</Link>
      <header className="mt-6 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p>
        <h1 className="mt-2 text-3xl font-black">Création, documents et identités</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">Renseigne le bureau, dépose les documents signés et transmets les pièces du bénéficiaire ou des témoins. Les pièces restent privées et les dossiers sont soumis à vérification.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Link href="/tontine/concepteur" className="rounded-xl border border-white/15 px-4 py-2 text-sm">Créer une tontine</Link><Link href="/tontine/contrat" className="inline-flex items-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2 text-sm font-bold text-[#0B1B3D]"><Download size={16}/> Ouvrir le contrat imprimable</Link></div>
      </header>
      {error && <div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-4 text-sm text-red-100">{error}</div>}
      {notice && <div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">{notice}</div>}
      <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-5">
        <label className="mb-2 block text-sm text-white/70">Tontine concernée</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full rounded-xl border border-white/15 bg-[#09152f] p-3 text-sm">{tontines.map((t) => <option key={t.id} value={t.id}>{t.name} — {CLASS_NAMES[t.tontine_class] || t.tontine_class}</option>)}</select>
        {!tontines.length && <p className="mt-3 text-sm text-amber-200">Aucune tontine associée à ton compte n’est accessible. Crée d’abord un brouillon ou demande au président de t’ajouter.</p>}
        <div className="mt-4 grid gap-3 md:grid-cols-3">{classes.map((item) => <article key={item.code} className="rounded-xl border border-white/10 p-3"><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs leading-5 text-white/50">{item.description}</p></article>)}</div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={saveBoard} className="space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="flex items-center gap-2"><Users className="text-[#F28C28]"/><h2 className="text-lg font-bold">Bureau d’organisation</h2></div>
          {board.map((row, index) => <div key={row.function_title} className="grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-xs text-white/60">{row.function_title} — nom complet</label><input value={row.full_name} onChange={(e) => setBoard((prev) => prev.map((item, i) => i === index ? { ...item, full_name: e.target.value } : item))} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-2.5 text-sm" placeholder="Nom et prénoms"/></div><div><label className="mb-1 block text-xs text-white/60">Téléphone</label><input value={row.phone} onChange={(e) => setBoard((prev) => prev.map((item, i) => i === index ? { ...item, phone: e.target.value } : item))} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-2.5 text-sm" placeholder="+229…"/></div></div>)}
          <button disabled={busy || !selected} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] p-3 font-bold text-[#0B1B3D] disabled:opacity-50"><ShieldCheck size={17}/> Enregistrer le bureau</button>
          <p className="text-xs leading-5 text-white/40">L’enregistrement ne vaut pas validation officielle. Les doublons éventuels doivent être contrôlés par le bureau avant nouvelle soumission.</p>
        </form>
        <form onSubmit={uploadPrivateDocument} className="space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-5">
          <div className="flex items-center gap-2"><FileText className="text-[#F28C28]"/><h2 className="text-lg font-bold">Documents de création</h2></div>
          <div><label className="mb-1 block text-sm text-white/60">Type de document</label><select value={docKind} onChange={(e) => setDocKind(e.target.value as typeof docKind)} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-3 text-sm">{DOC_KINDS.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="mb-1 block text-sm text-white/60">Fichier signé / numérisé</label><input id="tontine-document-file" required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:p-2 file:text-white" /></div>
          <p className="text-xs leading-5 text-white/40">PDF/JPG/PNG/WEBP, 15 Mo maximum. Le fichier est privé et n’est pas rendu accessible par le lien d’invitation.</p>
          <button disabled={busy || !selected || !file} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F28C28] p-3 font-bold text-[#0B1B3D] disabled:opacity-50"><Upload size={17}/> Envoyer le document</button>
        </form>
      </div>
      <form onSubmit={submitParty} className="mt-6 space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-5">
        <div className="flex items-center gap-2"><ShieldCheck className="text-[#F28C28]"/><h2 className="text-lg font-bold">Identité du bénéficiaire ou d’un témoin</h2></div>
        <p className="text-sm text-white/50">Soumets chaque personne séparément. Les témoins doivent donner leur accord et fournir leurs propres informations; n’enregistre pas leurs données sans leur consentement.</p>
        <div className="grid gap-4 md:grid-cols-3"><div><label className="mb-1 block text-sm text-white/60">Rôle</label><select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-3 text-sm"><option value="beneficiary">Bénéficiaire</option><option value="witness_1">Témoin 1</option><option value="witness_2">Témoin 2</option></select></div><div><label className="mb-1 block text-sm text-white/60">Nom complet</label><input required value={party.full_name} onChange={(e) => setParty({ ...party, full_name: e.target.value })} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-3 text-sm"/></div><div><label className="mb-1 block text-sm text-white/60">Téléphone vérifiable</label><input required type="tel" value={party.phone} onChange={(e) => setParty({ ...party, phone: e.target.value })} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-3 text-sm" placeholder="+229…"/></div></div>
        <div className="grid gap-4 md:grid-cols-3"><div><label className="mb-1 block text-sm text-white/60">Pays (code)</label><input required maxLength={2} value={party.country_code} onChange={(e) => setParty({ ...party, country_code: e.target.value.toUpperCase() })} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-3 text-sm"/></div><div><label className="mb-1 block text-sm text-white/60">Type de pièce</label><select value={party.identity_document_type} onChange={(e) => setParty({ ...party, identity_document_type: e.target.value })} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-3 text-sm"><option>Carte nationale d’identité</option><option>Passeport</option><option>Carte biométrique</option><option>Carte consulaire</option><option>Autre document admis localement</option></select></div><div><label className="mb-1 block text-sm text-white/60">Numéro masqué (facultatif)</label><input value={party.identity_document_number_masked} onChange={(e) => setParty({ ...party, identity_document_number_masked: e.target.value })} className="w-full rounded-lg border border-white/15 bg-[#09152f] p-3 text-sm" placeholder="Ex. ****1234"/></div></div>
        <div><label className="mb-1 block text-sm text-white/60">Scan de la pièce d’identité</label><input required type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setIdentityFile(e.target.files?.[0] || null)} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:p-2 file:text-white"/></div>
        <label className="flex items-start gap-2 text-xs text-white/60"><input required type="checkbox" className="mt-1"/> Je confirme que la personne concernée a été informée et consent à l’envoi de ces informations pour vérification.</label>
        <button disabled={busy || !selected} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-5 py-3 font-bold text-[#0B1B3D] disabled:opacity-50"><Upload size={17}/> Soumettre pour vérification</button>
      </form>
      <p className="mt-6 text-xs leading-5 text-white/35">La plateforme enregistre un dossier « soumis » uniquement. La vérification légale de la pièce, du numéro de téléphone et du statut du témoin exige un processus de contrôle dédié. N’effectue aucun versement avant validation.</p>
    </div>
  </main>;
}
