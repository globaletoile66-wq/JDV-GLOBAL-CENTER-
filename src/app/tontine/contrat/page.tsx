'use client';

import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';

const clauses = [
  ['Article 1 — Objet et acceptation', 'Le présent règlement définit les conditions de création et de fonctionnement d’une tontine via JDV Tontine. Chaque organisation complète la fiche de création et ses règles particulières. Les membres consultent et acceptent la version applicable avant le démarrage.'],
  ['Article 2 — Six classes de tontine', '1) Tontine rotative classique : cotisations périodiques et ordre de ramassage enregistré. 2) Épargne à objectif : objectif, échéance et conditions de sortie définis. 3) Tontine de solidarité : aide ou événement défini avec critères annoncés. 4) Tontine commerciale ou professionnelle : règles liées à une activité économique. 5) Cotisations flexibles : montants variables selon des bornes explicites et acceptées. 6) Tontine personnalisée : règles particulières communiquées et acceptées avant activation.'],
  ['Article 3 — Bureau et responsabilités', 'Le président renseigne les noms et fonctions du bureau. Les rôles sont enregistrés. Aucun rôle ne confère à lui seul un droit de retrait discrétionnaire sur les fonds. Les changements de bureau sont consignés et validés selon les règles de l’organisation.'],
  ['Article 4 — Création et adhésion', 'Le président télécharge la fiche, la complète, la fait signer puis dépose le document numérisé dans un espace privé. La plateforme génère un lien d’invitation contrôlé. Chaque membre complète son profil, fournit les justificatifs requis et accepte les règles avant validation.'],
  ['Article 5 — Identité, bénéficiaire et deux témoins', 'Les membres fournissent les pièces exigées dans le pays concerné. Le bénéficiaire renseigne un numéro ou compte de paiement vérifiable. Pour les deux témoins, le système recueille identité, téléphone, justificatifs applicables et consentement. Les scans sont privés; le lien d’invitation ne donne jamais accès directement aux pièces d’identité.'],
  ['Article 6 — Cotisations et calendrier', 'Le montant, la devise, la fréquence, les échéances, la durée, les pénalités et l’ordre des bénéficiaires sont affichés avant le démarrage. Les modifications importantes sont enregistrées et acceptées. Une cotisation n’est confirmée qu’après confirmation fiable du prestataire.'],
  ['Article 7 — Commission JDV par ramassage', 'La commission JDV correspond à une seule mise individuelle applicable au ramassage, et non à une mise par participant. Si les mises varient, la plateforme utilise la mise applicable selon les règles acceptées. Avant paiement, elle affiche le total collecté, la commission, les frais et le montant net. Formule : commission JDV = une mise individuelle applicable au ramassage. Net estimé = total effectivement collecté − commission JDV − frais annoncés. Aucun frais non annoncé ne doit être ajouté silencieusement.'],
  ['Article 8 — Fonds et prestataires', 'FedaPay, SebPay ou un autre prestataire ne peut être utilisé que pour les services, pays, devises et comptes activés. Une API de décaissement ne prouve pas que le prestataire peut légalement bloquer les fonds sous condition. La garde, les remboursements, délais et frais doivent être confirmés contractuellement avant lancement.'],
  ['Article 9 — Versement au bénéficiaire', 'Le versement est demandé seulement après collecte complète, vérification du bénéficiaire et de son compte, et absence de blocage. Le paiement est terminé après confirmation finale du prestataire. Si les fonds sont insuffisants ou la transaction incertaine, le versement est suspendu. Aucun versement partiel par défaut.'],
  ['Article 10 — Retards et pénalités', 'Les pénalités sont annoncées et acceptées avant le démarrage. Après trois cotisations manquées confirmées, le système ouvre un dossier de vérification. Toute sanction, y compris un éventuel report de trois positions, doit suivre une procédure écrite, être notifiée et contestable.'],
  ['Article 11 — Réserve de pénalités', 'Le solde confirmé reste bloqué jusqu’à la clôture. Sous réserve des dettes, litiges, frais et obligations légales, le solde distribuable est partagé à parts égales entre les membres admissibles vérifiés. Si le président est le seul membre admissible, il reçoit le solde. La règle d’arrondi est annoncée avant démarrage. En cas d’échec d’un transfert, la part concernée reste en attente et n’est pas redistribuée.'],
  ['Article 12 — Transparence et contestations', 'Les membres consultent les cotisations, pénalités, frais, commissions, net et statuts auxquels ils ont droit. Les opérations sensibles sont horodatées. Les contestations suivent une procédure publiée, avec escalade indépendante si le président est impliqué.'],
  ['Article 13 — Données personnelles', 'Les documents d’identité, coordonnées et contrats sont utilisés pour les finalités annoncées. L’organisation précise les droits d’accès, la durée de conservation, les droits des personnes et les mesures de sécurité. Les documents sont conservés dans un espace privé à accès limité.'],
  ['Article 14 — Suspension et clôture', 'La plateforme peut suspendre les opérations en cas de contrôle échoué, fonds insuffisants, transaction incertaine, fraude suspectée ou obligation légale. La clôture exige la réconciliation des cotisations, paiements, réserves et litiges.'],
  ['Article 15 — Droit applicable', 'Le pays, la loi applicable, la juridiction compétente et les autorisations financières doivent être précisés. Les clauses sur la garde des fonds, les sanctions et la réserve doivent être revues par un professionnel local avant usage.'],
];

export default function TontineContractPage() {
  return <main className="min-h-screen bg-white text-slate-900">
    <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b bg-[#0B1B3D] px-4 py-3 text-white">
      <Link href="/tontine/documents" className="inline-flex items-center gap-2 text-sm"><ArrowLeft size={16}/> Retour aux documents</Link>
      <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-[#F28C28] px-4 py-2 text-sm font-bold text-[#0B1B3D]"><Printer size={16}/> Imprimer / enregistrer en PDF</button>
    </div>
    <article className="mx-auto max-w-4xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <header className="border-b-4 border-[#F28C28] pb-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[.3em] text-[#F28C28]">JDV GLOBAL CENTER</p>
        <h1 className="mt-3 text-3xl font-black tracking-wide text-[#0B1B3D]">JDV TONTINE</h1>
        <h2 className="mt-2 text-xl font-bold">CONTRAT-CADRE DE PARTICIPATION ET RÈGLEMENT GÉNÉRAL</h2>
        <p className="mt-3 text-sm text-slate-500">Version de travail — 19 octobre 2026</p>
      </header>
      <div className="my-6 rounded-lg border border-amber-400 bg-amber-50 p-4 text-sm"><strong>IMPORTANT — PROJET À PERSONNALISER.</strong> Ce modèle n’est pas un contrat juridiquement validé. Le pays et le droit applicable doivent être renseignés; une revue par un juriste local est requise avant signature définitive et toute collecte de fonds. Le logo officiel doit être inséré dans la version finalisée.</div>
      <h2 className="mt-8 text-xl font-bold text-[#0B1B3D]">Fiche de création de l’organisation</h2>
      <table className="mt-3 w-full border-collapse text-sm"><tbody>{[
        ['Nom officiel de l’organisation',''],['Pays / droit applicable',''],['Adresse / localité',''],['Président fondateur et téléphone',''],['Date de création',''],['Classe de tontine',''],['Devise, mise individuelle et fréquence',''],['Dates de ramassage',''],['Bénéficiaire et compte/numéro de réception',''],
      ].map(([label]) => <tr key={label} className="h-10"><th className="w-2/5 border border-slate-300 bg-slate-50 px-3 text-left font-medium">{label}</th><td className="border border-slate-300 px-3"></td></tr>)}</tbody></table>
      <h3 className="mt-6 text-lg font-bold text-[#0B1B3D]">Composition du bureau d’organisation</h3>
      <table className="mt-3 w-full border-collapse text-sm"><thead><tr>{['Fonction','Nom complet','Téléphone','Signature'].map((x) => <th key={x} className="border border-slate-300 bg-slate-100 px-2 py-2 text-left">{x}</th>)}</tr></thead><tbody>{['Président(e)','Secrétaire','Trésorier(ère)','Autre fonction'].map((x) => <tr key={x} className="h-12"><td className="border border-slate-300 px-2">{x}</td><td className="border border-slate-300 px-2"></td><td className="border border-slate-300 px-2"></td><td className="border border-slate-300 px-2"></td></tr>)}</tbody></table>
      {clauses.map(([title, body]) => <section key={title} className="mt-6 break-inside-avoid"><h2 className="text-base font-bold text-[#0B1B3D]">{title}</h2><p className="mt-2 text-sm leading-6">{body}</p></section>)}
      <section className="mt-8 break-inside-avoid"><h2 className="text-xl font-bold text-[#0B1B3D]">Signatures</h2><p className="mt-2 text-sm">Les signatures attestent la lecture du présent projet et des règles particulières annexées. Elles ne remplacent pas les vérifications d’identité ou la revue juridique.</p>
      <table className="mt-3 w-full border-collapse text-sm"><thead><tr>{['Qualité','Nom complet','Date','Signature'].map((x) => <th key={x} className="border border-slate-300 bg-slate-100 px-2 py-2 text-left">{x}</th>)}</tr></thead><tbody>{['Président fondateur','Secrétaire','Trésorier','Bénéficiaire','Témoin 1','Témoin 2'].map((x) => <tr key={x} className="h-12"><td className="border border-slate-300 px-2">{x}</td><td className="border border-slate-300 px-2"></td><td className="border border-slate-300 px-2"></td><td className="border border-slate-300 px-2"></td></tr>)}</tbody></table></section>
      <footer className="mt-10 border-t pt-4 text-xs text-slate-500">JDV TONTINE — Projet de contrat cadre à personnaliser et faire valider localement.</footer>
    </article>
    <style jsx global>{`@media print { .no-print { display:none !important; } body { background:#fff !important; } article { box-shadow:none !important; } section, table { break-inside: avoid; } }`}</style>
  </main>;
}
