'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calculator, Handshake, Scale, ShieldCheck, Wallet } from 'lucide-react';

const field = 'w-full rounded-xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none focus:border-accent';
const money = (n:number) => new Intl.NumberFormat('fr-FR',{style:'currency',currency:'XOF',maximumFractionDigits:0}).format(Math.max(0,n));

export default function ImmoPartnersPage() {
  const [transactionValue,setTransactionValue]=useState('12000000');
  const [platformRate,setPlatformRate]=useState('5');
  const [agentShare,setAgentShare]=useState('40');
  const [ownerDirectRate,setOwnerDirectRate]=useState('3');
  const [caseType,setCaseType]=useState('sale');
  const [legalFee,setLegalFee]=useState('50000');
  const value=Math.max(0,Number(transactionValue)||0);
  const rate=Math.min(100,Math.max(0,Number(platformRate)||0))/100;
  const share=Math.min(100,Math.max(0,Number(agentShare)||0))/100;
  const directRate=Math.min(100,Math.max(0,Number(ownerDirectRate)||0))/100;
  const result=useMemo(()=>{
    const totalCommission=value*rate;
    return {totalCommission,agent:totalCommission*share,platform:totalCommission*(1-share),directPlatform:value*directRate};
  },[value,rate,share,directRate]);
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border bg-card/80"><div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4"><Link href="/immo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> Retour à JDV Immo</Link><span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold"><Handshake size={14}/> Réseau professionnel</span></div></header>
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">JDV IMMO · PARTENAIRES</p><h1 className="mt-2 text-3xl font-black sm:text-4xl">Un réseau immobilier transparent et durable</h1><p className="mt-3 text-muted-foreground">Préparez les règles de collaboration entre propriétaires, agents immobiliers, gestionnaires et professionnels du règlement des litiges. Les taux ci-dessous sont des hypothèses de simulation, pas des tarifs adoptés.</p></div>
      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[{title:'Propriétaire',desc:'Publier un bien, vérifier les documents, choisir les conditions et suivre les demandes.',icon:Wallet},{title:'Agent partenaire',desc:'Apporter des mandats, organiser les visites et suivre les transactions attribuées.',icon:Handshake},{title:'Huissier / médiateur',desc:'Intervenir dans le cadre légal applicable, documenter les constats et les notifications.',icon:Scale},{title:'JDV Immo',desc:'Fournir la visibilité, les outils, la traçabilité et le suivi des transactions.',icon:ShieldCheck}].map(item=><article key={item.title} className="rounded-2xl border border-border bg-card p-5"><item.icon size={23} className="text-accent"/><h2 className="mt-4 font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.desc}</p></article>)}
      </div>
      <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><div className="flex items-center gap-3"><Calculator size={22} className="text-accent"/><h2 className="text-xl font-bold">Simulateur de partage de commission</h2></div><p className="mt-2 text-sm text-muted-foreground">Modifiez les hypothèses pour comparer le modèle avec agent partenaire et le modèle de propriétaire en relation directe.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">Type de transaction<select className={field+' mt-2'} value={caseType} onChange={e=>setCaseType(e.target.value)}><option value="sale">Vente</option><option value="rent">Location</option><option value="management">Gestion locative</option></select></label>
            <label className="text-sm font-medium">Valeur de référence (FCFA)<input className={field+' mt-2'} type="number" min="0" value={transactionValue} onChange={e=>setTransactionValue(e.target.value)}/></label>
            <label className="text-sm font-medium">Commission totale simulée (%)<input className={field+' mt-2'} type="number" min="0" max="100" step=".25" value={platformRate} onChange={e=>setPlatformRate(e.target.value)}/></label>
            <label className="text-sm font-medium">Part de l’agent (%)<input className={field+' mt-2'} type="number" min="0" max="100" value={agentShare} onChange={e=>setAgentShare(e.target.value)}/></label>
            <label className="text-sm font-medium">Taux direct propriétaire → plateforme (%)<input className={field+' mt-2'} type="number" min="0" max="100" step=".25" value={ownerDirectRate} onChange={e=>setOwnerDirectRate(e.target.value)}/></label>
            <label className="text-sm font-medium">Frais professionnels indicatifs (FCFA)<input className={field+' mt-2'} type="number" min="0" value={legalFee} onChange={e=>setLegalFee(e.target.value)}/></label>
          </div>
          <div className="mt-5 rounded-xl border border-border p-4"><p className="text-sm font-semibold">Exemple de référence</p><p className="mt-1 text-sm text-muted-foreground">{caseType==='sale'?'Vente':caseType==='rent'?'Location':'Gestion locative'} · calcul sur la valeur saisie. Pour une location ou une gestion récurrente, remplacer la valeur par la base convenue (ex. loyer mensuel ou annuel).</p></div>
        </section>
        <section className="rounded-3xl border border-border bg-card p-5 sm:p-7"><h2 className="text-xl font-bold">Répartition estimative</h2><div className="mt-5 space-y-3">
          {[{label:'Commission totale simulée',value:money(result.totalCommission)},{label:'Rémunération agent partenaire',value:money(result.agent)},{label:'Revenu brut JDV via agent',value:money(result.platform)},{label:'Revenu brut JDV en direct',value:money(result.directPlatform)},{label:'Frais professionnels à budgéter',value:money(Number(legalFee)||0)}].map(row=><div key={row.label} className="flex items-center justify-between gap-3 rounded-xl bg-muted/30 p-3"><span className="text-sm text-muted-foreground">{row.label}</span><strong className="text-right text-sm">{row.value}</strong></div>)}
          <p className="pt-2 text-xs leading-5 text-muted-foreground">Les revenus affichés sont bruts, hors taxes, remboursements, coûts d’acquisition, litiges, charges et obligations fiscales. Aucune commission n’est facturée ou enregistrée par cet outil.</p>
        </div></section>
      </div>
      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5"><h2 className="font-bold">Règles à formaliser avant activation</h2><ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground md:grid-cols-2"><li>• Contrat et consentement du propriétaire avant publication ou mandat.</li><li>• Commission, fait générateur, échéance et annulation définis par écrit.</li><li>• Attribution de l’agent, preuves de visite et prévention du contournement.</li><li>• Vérification d’identité, qualification et territoire d’exercice des partenaires.</li><li>• Les huissiers interviennent uniquement dans le cadre de leurs compétences légales.</li><li>• Procédure de réclamation, médiation et conservation des pièces.</li></ul></div>
    </div>
  </main>;
}
