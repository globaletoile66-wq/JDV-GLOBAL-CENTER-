import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const TABS = [['/pay', 'Accueil'], ['/pay/send', 'Envoyer'], ['/pay/receive', 'Recevoir'], ['/pay/history', 'Historique'], ['/pay/beneficiaries', 'Bénéficiaires']] as const;

export default function PayHeader({ title, active, back = '/pay' }: { title: string; active: string; back?: string }) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-3">
        <Link href={back} aria-label="Retour" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <h1 className="text-xl font-extrabold text-foreground">{title}</h1>
      </div>
      <nav aria-label="JDV PAY" className="mt-4 flex gap-1 overflow-x-auto text-sm">
        {TABS.map(([href, label]) => (
          <Link key={href} href={href} aria-current={active === href ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 ${active === href ? 'bg-accent text-accent-foreground' : 'bg-muted text-foreground hover:bg-muted/70'}`}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
