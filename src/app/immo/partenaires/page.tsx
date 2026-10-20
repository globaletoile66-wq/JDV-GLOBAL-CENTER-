'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, FileCheck2, Handshake, RefreshCw, Scale, ShieldAlert, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type AgentApplication = { id: string; full_name: string; application_status: string; territory: string | null; created_at: string };
type Mandate = { id: string; title: string; mandate_type: string; mandate_status: string; commission_rate: number; created_at: string };
type Rule = { id: string; rule_name: string; transaction_type: string; platform_rate: number; agent_rate: number; rule_status: string; created_at: string };
type Dispute = { id: string; subject: string; dispute_status: string; created_at: string };
type PropertyOption = { id: string; title: string; city: string | null };
const field='w-full rounded-xl border border-white/10 bg-[#09152f] px-3 py-3 text-sm text-white outline-none focus:border-[#F28C28]';
const label='mb-1.5 mt-3 block text-xs font-semibold uppercase tracking-wide text-white/50';

export default function ImmoPartenairesPage() {
  const { user, loading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [application,setApplication]=useState<AgentApplication|null>(null);
  const [mandates,setMandates]=useState<Mandate[]>([]);
  const [rules,setRules]=useState<Rule[]>([]);
  const [disputes,setDisputes]=useState<Dispute[]>([]);
  const [properties,setProperties]=useState<PropertyOption[]>([]);
  const [busy,setBusy]=useState(false);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const [message,setMessage]=useState('');
  const [fullName,setFullName]=useState('');
  const [phone,setPhone]=useState('');
  const [territory,setTerritory]=useState('Bénin');
  const [specialties,setSpecialties]=useState('Location, vente, gestion locative');
  const [license,setLicense]=useState('');
  const [documentUrl,setDocumentUrl]=useState('');
  const [propertyId,setPropertyId]=useState('');
  const [experience,setExperience]=useState('1');
  const [mandateTitle,setMandateTitle]=useState('');
  const [mandateType,setMandateType]=useState('rental');
  const [commissionRate,setCommissionRate]=useState('5');
  const [ruleName,setRuleName]=useState('Règle proposée - à valider');
  const [transactionType,setTransactionType]=useState('rental');
  const [platformRate,setPlatformRate]=useState('2');
  const [agentRate,setAgentRate]=useState('3');
  const [professionalFee,setProfessionalFee]=useState('0');
  const [disputeSubject,setDisputeSubject]=useState('');
  const [disputeDescription,setDisputeDescription]=useState('');

  const load=useCallback(async()=>{
    if(!user)return;
    setBusy(true);setError('');
    const [a,m,r,d,p]=await Promise.all([
      supabase.from('immo_agent_applications').select('id,full_name,application_status,territory,created_at').eq('user_id',user.id).maybeSingle(),
      supabase.from('immo_mandates').select('id,title,mandate_type,mandate_status,commission_rate,created_at').eq('owner_user_id',user.id).order('created_at',{ascending:false}).limit(30),
      supabase.from('immo_commission_rules').select('id,rule_name,transaction_type,platform_rate,agent_rate,rule_status,created_at').eq('created_by',user.id).order('created_at',{ascending:false}).limit(30),
      supabase.from('immo_disputes').select('id,subject,dispute_status,created_at').eq('opened_by',user.id).order('created_at',{ascending:false}).limit(30),
      supabase.from('immo_properties').select('id,title,city').eq('owner_user_id',user.id).order('created_at',{ascending:false}).limit(100),
    ]);
    if(a.error||m.error||r.error||d.error||p.error){setError([a.error,m.error,r.error,d.error,p.error].filter(Boolean).map(x=>x!.message).join(' · '));}
    setApplication((a.data as AgentApplication|null)??null);if(a.data){setFullName(a.data.full_name);setTerritory(a.data.territory??'');}setMandates((m.data??[]) as Mandate[]);setRules((r.data??[]) as Rule[]);setDisputes((d.data??[]) as Dispute[]);setProperties((p.data??[]) as PropertyOption[]);
    setBusy(false);
  },[supabase,user]);
  useEffect(()=>{if(!loading&&user)void load();},[loading,user,load]);

  const submitApplication=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(!user){setError('Connectez-vous pour déposer une candidature.');return;}
    setSaving(true);setError('');setMessage('');
    const docs=documentUrl.trim()? [{label:'Pièce justificative',url:documentUrl.trim()}] : [];
    const payload={user_id:user.id,full_name:fullName.trim(),phone:phone.trim()||null,territory:territory.trim()||null,specialties:specialties.split(',').map(s=>s.trim()).filter(Boolean),license_number:license.trim()||null,experience_years:Math.max(0,Number(experience)||0),documents:docs,application_status:'pending'};
    const result=application
      ? await supabase.from('immo_agent_applications').update(payload).eq('id',application.id).eq('application_status','pending')
      : await supabase.from('immo_agent_applications').insert(payload);
    if(result.error)setError('Candidature non enregistrée : '+result.error.message);
    else{setMessage('Candidature enregistrée. La qualification reste en attente de vérification par JDV.');await load();}
    setSaving(false);
  };
  const submitMandate=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(!user){setError('Connectez-vous pour créer un mandat.');return;}
    if(!mandateTitle.trim()){setError('Donnez un titre au mandat.');return;}
    setSaving(true);setError('');setMessage('');
    const result=await supabase.from('immo_mandates').insert({owner_user_id:user.id,property_id:propertyId||null,title:mandateTitle.trim(),mandate_type:mandateType,commission_rate:Number(commissionRate)||0,terms:{summary:'Mandat en brouillon; les conditions complètes et signatures sont à formaliser.'},mandate_status:'draft'});
    if(result.error)setError('Mandat non enregistré : '+result.error.message);
    else{setMandateTitle('');setMessage('Mandat enregistré en brouillon. Il ne devient pas actif avant validation et acceptation des parties.');await load();}
    setSaving(false);
  };
  const submitRule=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(!user){setError('Connectez-vous pour proposer une règle.');return;}
    const p=Number(platformRate)||0,a=Number(agentRate)||0,fee=Number(professionalFee)||0;
    if(p<0||a<0||p+a>100||fee<0){setError('Les taux doivent être positifs et leur somme ne peut pas dépasser 100 %.');return;}
    setSaving(true);setError('');setMessage('');
    const result=await supabase.from('immo_commission_rules').insert({created_by:user.id,rule_name:ruleName.trim(),transaction_type:transactionType,platform_rate:p,agent_rate:a,professional_fee:fee,currency_code:'XOF',rule_status:'under_review',terms:{submitted_from:'JDV Immo Studio',requires_admin_validation:true}});
    if(result.error)setError('Règle non enregistrée : '+result.error.message);
    else{setMessage('Règle proposée et soumise à validation. Elle ne sera pas appliquée tant qu’elle ne sera pas approuvée.');await load();}
    setSaving(false);
  };
  const submitDispute=async(e:FormEvent<HTMLFormElement>)=>{
    e.preventDefault();if(!user){setError('Connectez-vous pour ouvrir un dossier.');return;}
    if(disputeSubject.trim().length<4||disputeDescription.trim().length<10){setError('Précisez le sujet et une description d’au moins 10 caractères.');return;}
    setSaving(true);setError('');setMessage('');
    const result=await supabase.from('immo_disputes').insert({opened_by:user.id,subject:disputeSubject.trim(),description:disputeDescription.trim(),dispute_status:'open'});
    if(result.error)setError('Dossier non enregistré : '+result.error.message);
    else{setDisputeSubject('');setDisputeDescription('');setMessage('Dossier de litige ouvert et enregistré. La résolution reste du ressort de l’équipe habilitée.');await load();}
    setSaving(false);
  };
  const money=(v:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'XOF',maximumFractionDigits:0}).format(v);
  const [value,setValue]=useState('1000000');
  const [totalRate,setTotalRate]=useState('5');
  const [agentShare,setAgentShare]=useState('60');
  const amount=Math.max(0,Number(value)||0),total=Math.max(0,Math.min(100,Number(totalRate)||0)),share=Math.max(0,Math.min(100,Number(agentShare)||0));
  const commission=amount*total/100;

  return <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8"><div className="mx-auto max-w-7xl">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/immo" className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour à JDV Immo</Link><div className="flex gap-2"><Link href="/immo/construction" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Construction</Link><Link href="/immo/gestion" className="rounded-xl border border-white/10 px-3 py-2 text-sm">Gestion locative</Link><button type="button" onClick={()=>void load()} disabled={!user||busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm disabled:opacity-50"><RefreshCw size={14} className={busy?'animate-spin':''}/> Actualiser</button></div></div>
    <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6 sm:p-8"><p className="text-xs font-bold uppercase tracking-[.25em] text-[#F28C28]">JDV GLOBAL CENTER</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Partenaires, mandats et commissions</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">Parcours d’inscription et de qualification des agents, brouillons de mandats, propositions de commissions et dossiers de litige. Les enregistrements sont sécurisés par Supabase lorsque la migration de workflow a été appliquée.</p>
    {!user&&!loading&&<div className="mt-5 rounded-xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-100">Connectez-vous pour enregistrer des candidatures, mandats, règles et dossiers. Les formulaires restent consultables mais ne sont pas enregistrés sans session.</div>}
    {error&&<div role="alert" className="mt-5 rounded-xl border border-red-300/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
    {message&&<div role="status" className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">{message}</div>}
    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      {title:'Propriétaires',desc:'Créer un dossier de bien et initier un mandat avant publication.',icon:Handshake},
      {title:'Agents immobiliers',desc:'Déposer identité professionnelle, spécialités, territoire et références.',icon:Users},
      {title:'Huissiers et médiateurs',desc:'Intervenir dans les limites de leurs compétences et habilitations légales.',icon:Scale},
      {title:'Qualification JDV',desc:'Contrôle documentaire et décision d’approbation par un responsable habilité.',icon:BadgeCheck},
    ].map(item=><article key={item.title} className="rounded-2xl border border-white/10 bg-white/[.03] p-4"><item.icon size={21} className="text-[#F28C28]"/><h2 className="mt-3 font-bold">{item.title}</h2><p className="mt-2 text-sm leading-5 text-white/55">{item.desc}</p></article>)}</div>
    </section>

    <div className="mt-6 grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"><div className="flex items-center gap-3"><BriefcaseBusiness className="text-[#F28C28]"/><h2 className="text-xl font-bold">Candidature agent / partenaire</h2></div>
        {application&&<p className="mt-3 rounded-xl border border-white/10 p-3 text-sm">Dernière candidature : <strong>{application.full_name}</strong> · statut <strong>{application.application_status}</strong>{application.territory?' · '+application.territory:''}</p>}
        <form onSubmit={submitApplication} className="mt-3"><label className={label}>Nom complet ou raison professionnelle *</label><input className={field} value={fullName||application?.full_name||''} onChange={e=>setFullName(e.target.value)} minLength={3} maxLength={160} required/><label className={label}>Téléphone</label><input className={field} value={phone} onChange={e=>setPhone(e.target.value)} maxLength={40}/><label className={label}>Territoire d’intervention</label><input className={field} value={territory} onChange={e=>setTerritory(e.target.value)} maxLength={120}/><label className={label}>Spécialités (séparées par des virgules)</label><input className={field} value={specialties} onChange={e=>setSpecialties(e.target.value)} maxLength={500}/><label className={label}>N° de carte / agrément (si applicable)</label><input className={field} value={license} onChange={e=>setLicense(e.target.value)} maxLength={160}/><label className={label}>Lien vers un justificatif professionnel (facultatif)</label><input className={field} type="url" value={documentUrl} onChange={e=>setDocumentUrl(e.target.value)} placeholder="https://…" maxLength={1000}/><label className={label}>Années d’expérience</label><input className={field} type="number" min="0" max="60" value={experience} onChange={e=>setExperience(e.target.value)}/><button disabled={saving||!user||(!!application&&application.application_status!=='pending')} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving?'Enregistrement…':application?(application.application_status==='pending'?'Mettre à jour la candidature':'Candidature en revue — contacter JDV'):'Soumettre la candidature'}</button></form>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"><div className="flex items-center gap-3"><FileCheck2 className="text-[#F28C28]"/><h2 className="text-xl font-bold">Mandat propriétaire</h2></div><p className="mt-2 text-sm text-white/55">Le mandat reste un brouillon tant que les conditions, l’identité des parties et les acceptations ne sont pas validées.</p>
        <form onSubmit={submitMandate}><label className={label}>Bien immobilier associé (facultatif)</label><select className={field} value={propertyId} onChange={e=>setPropertyId(e.target.value)}><option value="">Aucun bien lié pour le moment</option>{properties.map(p=><option key={p.id} value={p.id}>{p.title}{p.city?' · '+p.city:''}</option>)}</select><label className={label}>Objet du mandat *</label><input className={field} value={mandateTitle} onChange={e=>setMandateTitle(e.target.value)} minLength={3} maxLength={180} required placeholder="Ex. Mise en location d’un appartement"/><label className={label}>Type de mandat</label><select className={field} value={mandateType} onChange={e=>setMandateType(e.target.value)}><option value="rental">Location</option><option value="sale">Vente</option><option value="management">Gestion locative</option><option value="valuation">Évaluation</option><option value="construction">Projet de construction</option></select><label className={label}>Commission proposée (%)</label><input className={field} type="number" min="0" max="100" step=".1" value={commissionRate} onChange={e=>setCommissionRate(e.target.value)} required/><button disabled={saving||!user} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving?'Enregistrement…':'Créer le brouillon de mandat'}</button></form>
        <div className="mt-5 space-y-2">{mandates.map(m=><div key={m.id} className="rounded-xl border border-white/10 p-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{m.title}</strong><span className="text-xs text-[#F28C28]">{m.mandate_status}</span></div><p className="mt-1 text-xs text-white/45">{m.mandate_type} · Commission proposée {m.commission_rate}% · {new Date(m.created_at).toLocaleDateString('fr-FR')}</p></div>)}{user&&!busy&&!mandates.length&&<p className="text-xs text-white/40">Aucun mandat enregistré.</p>}</div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"><div className="flex items-center gap-3"><Scale className="text-[#F28C28]"/><h2 className="text-xl font-bold">Proposer une règle de commission</h2></div><p className="mt-2 text-sm text-white/55">Toute règle soumise reste en revue ; aucun calcul n’est facturé ou appliqué avant approbation administrative.</p><form onSubmit={submitRule}><label className={label}>Nom de la règle *</label><input className={field} value={ruleName} onChange={e=>setRuleName(e.target.value)} maxLength={160} required/><label className={label}>Type de transaction</label><select className={field} value={transactionType} onChange={e=>setTransactionType(e.target.value)}><option value="rental">Location</option><option value="sale">Vente</option><option value="management">Gestion</option><option value="construction">Construction</option><option value="other">Autre</option></select><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="text-xs text-white/60">Part plateforme (%)<input className={field} type="number" min="0" max="100" step=".1" value={platformRate} onChange={e=>setPlatformRate(e.target.value)}/></label><label className="text-xs text-white/60">Part agent (%)<input className={field} type="number" min="0" max="100" step=".1" value={agentRate} onChange={e=>setAgentRate(e.target.value)}/></label><label className="text-xs text-white/60">Frais pro (XOF)<input className={field} type="number" min="0" value={professionalFee} onChange={e=>setProfessionalFee(e.target.value)}/></label></div><button disabled={saving||!user} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving?'Enregistrement…':'Soumettre pour validation'}</button></form>
        <div className="mt-5 space-y-2">{rules.map(r=><div key={r.id} className="rounded-xl border border-white/10 p-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{r.rule_name}</strong><span className="text-xs text-[#F28C28]">{r.rule_status}</span></div><p className="mt-1 text-xs text-white/45">{r.transaction_type} · plateforme {r.platform_rate}% · agent {r.agent_rate}%</p></div>)}{user&&!busy&&!rules.length&&<p className="text-xs text-white/40">Aucune règle proposée.</p>}</div>
      </section>
      <section className="rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"><div className="flex items-center gap-3"><ShieldAlert className="text-[#F28C28]"/><h2 className="text-xl font-bold">Litiges et médiation</h2></div><form onSubmit={submitDispute}><label className={label}>Sujet du litige *</label><input className={field} value={disputeSubject} onChange={e=>setDisputeSubject(e.target.value)} minLength={4} maxLength={180} required/><label className={label}>Description et chronologie *</label><textarea className={field} rows={4} value={disputeDescription} onChange={e=>setDisputeDescription(e.target.value)} minLength={10} maxLength={8000} required/><button disabled={saving||!user} className="mt-4 w-full rounded-xl bg-[#F28C28] px-4 py-3 font-bold text-[#0B1B3D] disabled:opacity-50">{saving?'Enregistrement…':'Ouvrir un dossier'}</button></form><div className="mt-5 space-y-2">{disputes.map(d=><div key={d.id} className="rounded-xl border border-white/10 p-3"><div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{d.subject}</strong><span className="text-xs text-[#F28C28]">{d.dispute_status}</span></div><p className="mt-1 text-xs text-white/45">{new Date(d.created_at).toLocaleDateString('fr-FR')}</p></div>)}{user&&!busy&&!disputes.length&&<p className="text-xs text-white/40">Aucun dossier ouvert par ce compte.</p>}</div></section>
    </div>

    <section className="mt-6 rounded-3xl border border-white/10 bg-white/[.04] p-5 sm:p-7"><div className="flex items-center gap-3"><Handshake className="text-[#F28C28]"/><h2 className="text-xl font-bold">Simulateur de répartition — indicatif</h2></div><div className="mt-5 grid gap-4 md:grid-cols-3"><label className="text-sm text-white/60">Base de calcul (XOF)<input className={field} type="number" min="0" value={value} onChange={e=>setValue(e.target.value)}/></label><label className="text-sm text-white/60">Commission totale (%)<input className={field} type="number" min="0" max="100" step=".1" value={totalRate} onChange={e=>setTotalRate(e.target.value)}/></label><label className="text-sm text-white/60">Part de l’agent (%)<input className={field} type="number" min="0" max="100" value={agentShare} onChange={e=>setAgentShare(e.target.value)}/></label></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[{label:'Commission totale',value:money(commission)},{label:'Part agent',value:money(commission*share/100)},{label:'Part plateforme',value:money(commission*(100-share)/100)}].map(row=><div key={row.label} className="rounded-xl bg-white/[.05] p-4"><p className="text-sm text-white/50">{row.label}</p><p className="mt-2 text-xl font-bold">{row.value}</p></div>)}</div><p className="mt-4 text-xs leading-5 text-white/40">Simulation indicative hors taxes, frais professionnels, remboursements, charges et obligations fiscales. Le calcul n’entraîne aucune facturation. Les règles approuvées doivent préciser base, événement déclencheur, échéance, annulation et partage.</p></section>
    {error.includes('immo_agent_applications')||error.includes('immo_mandates')||error.includes('immo_commission_rules')||error.includes('immo_disputes')?<p className="mt-4 text-xs leading-5 text-amber-200/80">Les workflows serveur attendent la migration <code>20261020070000_jdv_immo_persistent_workflows.sql</code>. Elle est préparée dans la branche GitHub, mais n’a pas été appliquée à Supabase.</p>:null}
  </div></main>;
}
