'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, BookOpen, Scale, ShieldCheck, CalendarDays, FileText, Users, BriefcaseBusiness, MessageCircle, Plus, RefreshCw, ExternalLink, LibraryBig } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type Professional = {
  id: string; user_id: string; display_name: string; professional_type: string;
  country_code: string; city: string | null; specialties: string[] | null;
  languages: string[] | null; biography: string | null; firm_name: string | null;
  verification_status: string;
};
type Resource = {
  id: string; title: string; summary: string | null; resource_type: string;
  country_code: string; legal_area: string | null; language: string;
  publication_date: string | null; source_url: string | null; author: string | null;
};
type Consultation = { id: string; subject: string; legal_area: string; country_code: string; status: string; created_at: string };

const inputClass = 'w-full rounded-xl border border-white/15 bg-[#07142e] px-3.5 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const buttonClass = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#F28C28] px-4 py-2.5 text-sm font-bold text-[#0B1B3D] disabled:opacity-50';
const outlineClass = 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white hover:border-[#F28C28]/60';
const countryNames: Record<string, string> = { BJ: 'Bénin', CI: "Côte d’Ivoire", SN: 'Sénégal', TG: 'Togo', BF: 'Burkina Faso', ML: 'Mali', NE: 'Niger', GH: 'Ghana', NG: 'Nigeria', CM: 'Cameroun', CD: 'RD Congo', FR: 'France' };
const professionalTypes = [
  { value: 'lawyer', label: 'Avocat / Avocate' }, { value: 'law_firm', label: 'Cabinet d’avocats' },
  { value: 'notary', label: 'Notaire' }, { value: 'bailiff', label: 'Commissaire de justice / Huissier' },
  { value: 'legal_advisor', label: 'Juriste / Conseil juridique' }, { value: 'mediator', label: 'Médiateur' },
  { value: 'legal_aid', label: 'Structure d’aide juridique' },
];
const areas = ['Droit des affaires', 'Droit du travail', 'Droit foncier et immobilier', 'Droit de la famille', 'Droit pénal', 'Droit administratif', 'Droit fiscal', 'Droit des contrats', 'Droit des sociétés', 'Droits humains', 'Propriété intellectuelle', 'Médiation'];
const resourceTypes = [
  { value: 'law', label: 'Lois et textes' }, { value: 'case_law', label: 'Jurisprudence publiée' },
  { value: 'book', label: 'Livres et ouvrages' }, { value: 'guide', label: 'Guides pratiques' },
  { value: 'article', label: 'Articles juridiques' }, { value: 'template', label: 'Modèles de documents' },
];
const statusLabels: Record<string, string> = { requested: 'Demandée', pending: 'En attente', accepted: 'Acceptée', rejected: 'Refusée', completed: 'Terminée', cancelled: 'Annulée' };

export default function LegalPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<'professionals' | 'library' | 'consultations' | 'join'>('professionals');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('BJ');
  const [area, setArea] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [consultationForm, setConsultationForm] = useState({ subject: '', description: '', legal_area: 'Droit des affaires', country_code: 'BJ' });
  const [profileForm, setProfileForm] = useState({ display_name: '', professional_type: 'lawyer', country_code: 'BJ', city: '', firm_name: '', specialties: 'Droit des affaires', languages: 'Français', biography: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    const [people, docs] = await Promise.all([
      supabase.from('legal_professionals').select('id,user_id,display_name,professional_type,country_code,city,specialties,languages,biography,firm_name,verification_status').eq('verification_status', 'verified').eq('is_active', true).order('display_name').limit(60),
      supabase.from('legal_resources').select('id,title,summary,resource_type,country_code,legal_area,language,publication_date,source_url,author').eq('publication_status', 'published').order('publication_date', { ascending: false }).limit(100),
    ]);
    if (people.error || docs.error) {
      setError('Les données juridiques ne sont pas encore disponibles. Le schéma de JDV Légal doit être installé et les règles d’accès vérifiées avant l’activation.');
      setProfessionals([]);
      setResources([]);
    } else {
      setProfessionals((people.data ?? []) as Professional[]);
      setResources((docs.data ?? []) as Resource[]);
    }
    if (user) {
      const mine = await supabase.from('legal_consultation_requests').select('id,subject,legal_area,country_code,status,created_at').eq('requester_user_id', user.id).order('created_at', { ascending: false }).limit(30);
      setConsultations(mine.error ? [] : (mine.data ?? []) as Consultation[]);
    } else setConsultations([]);
    setBusy(false);
  }, [supabase, user]);

  useEffect(() => { if (!authLoading) void load(); }, [authLoading, load]);

  const visibleProfessionals = professionals.filter((p) => {
    const haystack = [p.display_name, p.firm_name, p.city, p.country_code, ...(p.specialties ?? [])].join(' ').toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!country || p.country_code === country) && (!area || (p.specialties ?? []).includes(area));
  });
  const visibleResources = resources.filter((r) => {
    const haystack = [r.title, r.summary, r.author, r.legal_area, r.country_code].join(' ').toLowerCase();
    return (!query || haystack.includes(query.toLowerCase())) && (!country || r.country_code === country) && (!resourceType || r.resource_type === resourceType) && (!area || r.legal_area === area);
  });

  async function submitConsultation(event: FormEvent) {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour envoyer une demande confidentielle.'); return; }
    if (!selectedProfessional) return;
    setSaving(true); setError(''); setNotice('');
    const { error: insertError } = await supabase.from('legal_consultation_requests').insert({
      requester_user_id: user.id, professional_id: selectedProfessional.id, subject: consultationForm.subject.trim(),
      description: consultationForm.description.trim(), legal_area: consultationForm.legal_area,
      country_code: consultationForm.country_code, status: 'requested',
    });
    if (insertError) setError('La demande n’a pas pu être envoyée. Vérifiez que la migration JDV Légal est installée et que votre session est valide.');
    else {
      setNotice('Votre demande a été transmise de manière privée. Le professionnel pourra l’accepter ou vous recontacter via les fonctions activées.');
      setSelectedProfessional(null); setConsultationForm({ subject: '', description: '', legal_area: 'Droit des affaires', country_code: 'BJ' });
      await load(); setTab('consultations');
    }
    setSaving(false);
  }

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    if (!user) { setError('Connectez-vous pour proposer votre inscription professionnelle.'); return; }
    if (!profileForm.display_name.trim()) { setError('Indiquez votre nom professionnel ou le nom du cabinet.'); return; }
    setSaving(true); setError(''); setNotice('');
    const { error: insertError } = await supabase.from('legal_professionals').upsert({
      user_id: user.id, display_name: profileForm.display_name.trim(), professional_type: profileForm.professional_type,
      country_code: profileForm.country_code, city: profileForm.city.trim() || null, firm_name: profileForm.firm_name.trim() || null,
      specialties: profileForm.specialties.split(',').map(s => s.trim()).filter(Boolean),
      languages: profileForm.languages.split(',').map(s => s.trim()).filter(Boolean),
      biography: profileForm.biography.trim() || null, verification_status: 'pending', is_active: false,
    }, { onConflict: 'user_id' });
    if (insertError) setError('La demande d’inscription n’a pas pu être enregistrée. Réessayez après activation du schéma JDV Légal.');
    else setNotice('Demande enregistrée : votre profil restera non public jusqu’à la vérification des justificatifs professionnels.');
    setSaving(false);
  }

  const tabs = [
    { id: 'professionals' as const, label: 'Professionnels', icon: Users },
    { id: 'library' as const, label: 'Bibliothèque juridique', icon: LibraryBig },
    { id: 'consultations' as const, label: 'Mes demandes', icon: CalendarDays },
    { id: 'join' as const, label: 'Inscription professionnelle', icon: BriefcaseBusiness },
  ];

  return (
    <main className="min-h-screen bg-[#0B1B3D] text-white">
      <header className="border-b border-white/10 bg-[#08152f]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft size={16}/> JDV GLOBAL CENTER</Link>
          <div className="flex items-center gap-2">
            <Link href="/academy" className={outlineClass}><BookOpen size={16}/> JDV Academy</Link>
            <Link href={user ? '/profile' : '/auth/login'} className={buttonClass}>{user ? 'Mon espace' : 'Se connecter'}</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#F28C28]/20 via-transparent to-transparent" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:py-16 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F28C28]/40 bg-[#F28C28]/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#ffbd78]"><Scale size={15}/> Espace juridique panafricain</div>
            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl">Le droit, les ressources et les professionnels à portée de main.</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70">Trouvez des professionnels vérifiés, explorez les ressources juridiques et demandez une consultation privée, dans le respect des règles de chaque pays.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => { setTab('professionals'); document.getElementById('legal-workspace')?.scrollIntoView({ behavior: 'smooth' }); }} className={buttonClass}><Search size={17}/> Trouver un professionnel</button>
              <button onClick={() => { setTab('library'); document.getElementById('legal-workspace')?.scrollIntoView({ behavior: 'smooth' }); }} className={outlineClass}><BookOpen size={17}/> Explorer la bibliothèque</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, value: professionals.length.toString(), label: 'Professionnels vérifiés' },
              { icon: BookOpen, value: resources.length.toString(), label: 'Ressources publiées' },
              { icon: ShieldCheck, value: 'Privé', label: 'Demandes confidentielles' },
              { icon: Scale, value: 'Multi-pays', label: 'Droit par juridiction' },
            ].map((item) => <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5"><item.icon className="mb-4 text-[#F28C28]" size={22}/><div className="text-2xl font-extrabold">{item.value}</div><div className="mt-1 text-sm text-white/55">{item.label}</div></div>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10" id="legal-workspace">
        <div className="mb-6 flex flex-wrap gap-2">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => { setTab(id); setError(''); setNotice(''); }} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${tab === id ? 'bg-[#F28C28] text-[#0B1B3D]' : 'border border-white/10 bg-white/[0.03] text-white/70 hover:text-white'}`}><Icon size={17}/>{label}</button>)}
          <button onClick={() => void load()} className={outlineClass} aria-label="Actualiser"><RefreshCw size={16}/></button>
        </div>

        {error && <div role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</div>}
        {notice && <div role="status" className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{notice}</div>}

        {tab === 'professionals' && <>
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
              <label className="relative block"><span className="sr-only">Rechercher un professionnel</span><Search className="absolute left-3 top-3.5 text-white/40" size={17}/><input className={inputClass + ' pl-10'} value={query} onChange={e => setQuery(e.target.value)} placeholder="Nom, cabinet, ville, spécialité…"/></label>
              <select className={inputClass} value={country} onChange={e => setCountry(e.target.value)}><option value="">Tous les pays</option>{Object.entries(countryNames).map(([code,name]) => <option key={code} value={code}>{name}</option>)}</select>
              <select className={inputClass} value={area} onChange={e => setArea(e.target.value)}><option value="">Toutes les spécialités</option>{areas.map(a => <option key={a}>{a}</option>)}</select>
            </div>
          </div>
          {busy ? <p className="py-12 text-center text-white/60">Chargement des professionnels…</p> : visibleProfessionals.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center"><Users className="mx-auto mb-3 text-white/35" size={32}/><h2 className="text-lg font-bold">Aucun professionnel vérifié pour ces critères</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/55">Essayez une autre recherche ou proposez à un professionnel de rejoindre JDV Légal. Les profils ne sont affichés publiquement qu’après vérification.</p><button onClick={() => setTab('join')} className={buttonClass + ' mt-5'}><Plus size={16}/> Proposer une inscription</button></div> :
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleProfessionals.map(p => <article key={p.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F28C28]/15 text-[#F28C28]"><Scale size={22}/></div><span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200"><ShieldCheck size={13}/> Vérifié</span></div>
              <h2 className="mt-4 text-lg font-extrabold">{p.display_name}</h2><p className="mt-1 text-sm text-white/55">{professionalTypes.find(t => t.value === p.professional_type)?.label ?? p.professional_type}{p.firm_name ? ' · ' + p.firm_name : ''}</p>
              <p className="mt-3 text-sm text-white/65">{[p.city, countryNames[p.country_code] ?? p.country_code].filter(Boolean).join(', ')}</p>
              {p.specialties?.length ? <div className="mt-4 flex flex-wrap gap-1.5">{p.specialties.slice(0,4).map(s => <span key={s} className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/75">{s}</span>)}</div> : null}
              {p.biography && <p className="mt-4 line-clamp-3 text-sm leading-6 text-white/60">{p.biography}</p>}
              <button onClick={() => { setSelectedProfessional(p); setConsultationForm(f => ({...f, country_code:p.country_code})); setError(''); }} className={buttonClass + ' mt-5 w-full'}><CalendarDays size={16}/> Demander une consultation</button>
            </article>)}</div>}
        </>}

        {tab === 'library' && <>
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div className="grid gap-3 md:grid-cols-[1fr_180px_180px_220px]">
              <label className="relative block"><span className="sr-only">Rechercher dans la bibliothèque</span><Search className="absolute left-3 top-3.5 text-white/40" size={17}/><input className={inputClass + ' pl-10'} value={query} onChange={e => setQuery(e.target.value)} placeholder="Titre, auteur, mot-clé…"/></label>
              <select className={inputClass} value={country} onChange={e => setCountry(e.target.value)}><option value="">Tous les pays</option>{Object.entries(countryNames).map(([code,name]) => <option key={code} value={code}>{name}</option>)}</select>
              <select className={inputClass} value={resourceType} onChange={e => setResourceType(e.target.value)}><option value="">Tous les documents</option>{resourceTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
              <select className={inputClass} value={area} onChange={e => setArea(e.target.value)}><option value="">Toutes les matières</option>{areas.map(a => <option key={a}>{a}</option>)}</select>
            </div>
          </div>
          {busy ? <p className="py-12 text-center text-white/60">Chargement de la bibliothèque…</p> : visibleResources.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center"><BookOpen className="mx-auto mb-3 text-white/35" size={32}/><h2 className="text-lg font-bold">La bibliothèque se constitue progressivement</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-white/55">Les ressources publiées seront classées par pays, matière, type et langue. Les ouvrages protégés ne seront proposés que dans le respect des droits de leurs auteurs et éditeurs.</p></div> :
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleResources.map(r => <article key={r.id} className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-[#F28C28]/15 p-3 text-[#F28C28]">{r.resource_type === 'book' ? <BookOpen size={22}/> : <FileText size={22}/>}</div><span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-white/65">{resourceTypes.find(t => t.value === r.resource_type)?.label ?? r.resource_type}</span></div>
              <h2 className="mt-4 text-lg font-bold">{r.title}</h2>{r.author && <p className="mt-1 text-sm text-white/55">{r.author}</p>}
              <p className="mt-3 flex-1 text-sm leading-6 text-white/65">{r.summary || 'Référence juridique publiée.'}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45"><span>{countryNames[r.country_code] ?? r.country_code}</span>{r.legal_area && <span>· {r.legal_area}</span>}<span>· {r.language.toUpperCase()}</span></div>
              {r.source_url && <a href={r.source_url} target="_blank" rel="noreferrer" className={outlineClass + ' mt-4 w-full'}>Consulter la source <ExternalLink size={15}/></a>}
            </article>)}</div>}
        </>}

        {tab === 'consultations' && <>
          {!user ? <div className="rounded-2xl border border-white/10 p-10 text-center"><ShieldCheck className="mx-auto mb-3 text-[#F28C28]" size={32}/><h2 className="text-xl font-bold">Un espace privé pour vos demandes</h2><p className="mt-2 text-sm text-white/55">Connectez-vous pour retrouver vos demandes de consultation et leur état d’avancement.</p><Link href="/auth/login" className={buttonClass + ' mt-5'}>Se connecter</Link></div> :
          consultations.length === 0 ? <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center"><CalendarDays className="mx-auto mb-3 text-white/35" size={32}/><h2 className="text-lg font-bold">Aucune demande pour le moment</h2><p className="mt-2 text-sm text-white/55">Recherchez un professionnel puis sélectionnez « Demander une consultation ».</p><button onClick={() => setTab('professionals')} className={buttonClass + ' mt-5'}>Trouver un professionnel</button></div> :
          <div className="overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1fr_150px_110px] gap-3 bg-white/[0.05] px-4 py-3 text-xs font-bold uppercase tracking-wide text-white/50"><span>Demande</span><span>Pays / matière</span><span>État</span></div>{consultations.map(c => <div key={c.id} className="grid grid-cols-[1fr_150px_110px] gap-3 border-t border-white/10 px-4 py-4 text-sm"><div><p className="font-bold">{c.subject}</p><p className="mt-1 text-xs text-white/45">{new Date(c.created_at).toLocaleDateString('fr-FR')}</p></div><div className="text-white/60">{countryNames[c.country_code] ?? c.country_code}<p className="mt-1 text-xs">{c.legal_area}</p></div><div><span className="rounded-full bg-white/10 px-2 py-1 text-xs">{statusLabels[c.status] ?? c.status}</span></div></div>)}</div>}
        </>}

        {tab === 'join' && <>
          <div className="mb-5 max-w-3xl rounded-2xl border border-[#F28C28]/20 bg-[#F28C28]/[0.06] p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-1 shrink-0 text-[#F28C28]" size={22}/><div><h2 className="font-bold">Inscription et vérification professionnelles</h2><p className="mt-1 text-sm leading-6 text-white/65">Les informations fournies seront examinées. Le profil ne sera pas visible dans l’annuaire avant validation des justificatifs et des conditions d’exercice applicables dans le pays choisi.</p></div></div></div>
          {!user && <div className="mb-5 rounded-xl border border-white/10 p-4 text-sm text-white/70">Vous devez être connecté pour enregistrer votre demande. <Link href="/auth/login" className="font-bold text-[#ffbd78] underline">Se connecter</Link></div>}
          <form onSubmit={submitProfile} className="grid max-w-4xl gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:grid-cols-2">
            <label className="text-sm text-white/70">Nom professionnel / cabinet *<input required className={inputClass + ' mt-2'} value={profileForm.display_name} onChange={e => setProfileForm(f => ({...f,display_name:e.target.value}))} placeholder="Nom complet ou cabinet"/></label>
            <label className="text-sm text-white/70">Catégorie professionnelle<select className={inputClass + ' mt-2'} value={profileForm.professional_type} onChange={e => setProfileForm(f => ({...f,professional_type:e.target.value}))}>{professionalTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
            <label className="text-sm text-white/70">Pays<select className={inputClass + ' mt-2'} value={profileForm.country_code} onChange={e => setProfileForm(f => ({...f,country_code:e.target.value}))}>{Object.entries(countryNames).map(([code,name]) => <option key={code} value={code}>{name}</option>)}</select></label>
            <label className="text-sm text-white/70">Ville<input className={inputClass + ' mt-2'} value={profileForm.city} onChange={e => setProfileForm(f => ({...f,city:e.target.value}))} placeholder="Cotonou, Abidjan…"/></label>
            <label className="text-sm text-white/70">Nom du cabinet (si applicable)<input className={inputClass + ' mt-2'} value={profileForm.firm_name} onChange={e => setProfileForm(f => ({...f,firm_name:e.target.value}))} placeholder="Cabinet…"/></label>
            <label className="text-sm text-white/70">Spécialités (séparées par des virgules)<input className={inputClass + ' mt-2'} value={profileForm.specialties} onChange={e => setProfileForm(f => ({...f,specialties:e.target.value}))}/></label>
            <label className="text-sm text-white/70">Langues (séparées par des virgules)<input className={inputClass + ' mt-2'} value={profileForm.languages} onChange={e => setProfileForm(f => ({...f,languages:e.target.value}))}/></label>
            <label className="text-sm text-white/70 sm:col-span-2">Présentation professionnelle<textarea rows={4} className={inputClass + ' mt-2'} value={profileForm.biography} onChange={e => setProfileForm(f => ({...f,biography:e.target.value}))} placeholder="Expérience, domaines d’intervention, type de clientèle…"/></label>
            <div className="sm:col-span-2"><button disabled={saving || !user} className={buttonClass}><Plus size={16}/>{saving ? 'Enregistrement…' : 'Soumettre mon inscription'}</button></div>
          </form>
        </>}
      </section>

      {selectedProfessional && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="consultation-title">
        <form onSubmit={submitConsultation} className="my-8 w-full max-w-xl rounded-2xl border border-white/15 bg-[#0B1B3D] p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-4"><div><h2 id="consultation-title" className="text-xl font-extrabold">Demander une consultation</h2><p className="mt-1 text-sm text-white/60">Avec {selectedProfessional.display_name}</p></div><button type="button" onClick={() => setSelectedProfessional(null)} className="rounded-lg px-3 py-1 text-white/60 hover:bg-white/10" aria-label="Fermer">✕</button></div>
          {!user && <p className="mt-4 rounded-xl border border-[#F28C28]/30 bg-[#F28C28]/10 p-3 text-sm">Connectez-vous pour transmettre une demande privée. <Link href="/auth/login" className="underline">Se connecter</Link></p>}
          <label className="mt-5 block text-sm text-white/70">Objet de la demande *<input required maxLength={160} className={inputClass + ' mt-2'} value={consultationForm.subject} onChange={e => setConsultationForm(f => ({...f,subject:e.target.value}))} placeholder="Ex. : consultation sur un contrat"/></label>
          <label className="mt-4 block text-sm text-white/70">Domaine juridique<select className={inputClass + ' mt-2'} value={consultationForm.legal_area} onChange={e => setConsultationForm(f => ({...f,legal_area:e.target.value}))}>{areas.map(a => <option key={a}>{a}</option>)}</select></label>
          <label className="mt-4 block text-sm text-white/70">Pays concerné<select className={inputClass + ' mt-2'} value={consultationForm.country_code} onChange={e => setConsultationForm(f => ({...f,country_code:e.target.value}))}>{Object.entries(countryNames).map(([code,name]) => <option key={code} value={code}>{name}</option>)}</select></label>
          <label className="mt-4 block text-sm text-white/70">Description initiale *<textarea required minLength={15} maxLength={5000} rows={5} className={inputClass + ' mt-2'} value={consultationForm.description} onChange={e => setConsultationForm(f => ({...f,description:e.target.value}))} placeholder="Décrivez les faits utiles sans inclure d’informations sensibles inutiles."/></label>
          <p className="mt-3 text-xs leading-5 text-white/45">La demande est privée selon les règles d’accès de la plateforme. N’envoyez pas de documents sensibles avant confirmation du professionnel et vérification des conditions de confidentialité.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => setSelectedProfessional(null)} className={outlineClass}>Annuler</button><button disabled={saving || !user} className={buttonClass}><MessageCircle size={16}/>{saving ? 'Envoi…' : 'Envoyer la demande'}</button></div>
        </form>
      </div>}
      <footer className="border-t border-white/10 px-5 py-6 text-center text-xs leading-5 text-white/40">JDV Légal facilite l’accès à l’information et aux professionnels. Il ne remplace pas un conseil juridique personnalisé. Les demandes de consultation ne sont pas des audiences judiciaires officielles.</footer>
    </main>
  );
}
