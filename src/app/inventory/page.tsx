'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Package, RefreshCw, Search, Warehouse } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type StockRow = {
  id: string; quantity: number; reserved_quantity: number; minimum_quantity: number; updated_at: string;
  article: { id: string; code: string; name: string; unit: string | null; category: string | null } | null;
};

export default function InventoryPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    if (!user) { setRows([]); setLoading(false); return; }
    const { data, error: loadError } = await supabase.from('stocks')
      .select('id,quantity,reserved_quantity,minimum_quantity,updated_at,article:articles(id,code,name,unit,category)')
      .order('updated_at', { ascending: false }).limit(500);
    if (loadError) {
      setRows([]);
      setError('Les stocks ne peuvent pas être chargés. Vérifiez votre accès organisationnel et les autorisations Supabase.');
    } else setRows((data ?? []) as unknown as StockRow[]);
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (authLoading) return;
    if (user) void load();
    else { setRows([]); setError(''); setQuery(''); setLoading(false); }
  }, [authLoading, user, load]);

  const filtered = rows.filter((row) => [row.article?.name ?? '', row.article?.code ?? '', row.article?.category ?? ''].some((v) => v.toLowerCase().includes(query.toLowerCase())));
  const lowStock = rows.filter((row) => Number(row.quantity) - Number(row.reserved_quantity) <= Number(row.minimum_quantity));
  const totalUnits = rows.reduce((sum, row) => sum + Number(row.quantity), 0);
  const availableUnits = rows.reduce((sum, row) => sum + Number(row.quantity) - Number(row.reserved_quantity), 0);

  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft size={16}/> JDV GLOBAL CENTER</Link><Link href={user?'/dashboard':'/auth/login'} className="btn-secondary">{user?'Mon espace':'Se connecter'}</Link></div></header>
    <section className="mx-auto max-w-7xl px-5 py-10">
      <div className="flex flex-wrap items-start justify-between gap-5"><div><p className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-accent"><Package size={15}/> JDV INVENTORY</p><h1 className="mt-4 text-4xl font-black">Stocks et disponibilité</h1><p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Vue consolidée des quantités enregistrées, des réservations et des seuils minimums. Les données restent filtrées par les autorisations de votre organisation.</p></div><button onClick={() => void load()} disabled={loading || !user} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={15} className={loading?'animate-spin':''}/> Actualiser</button></div>
      {!user && !authLoading && <div className="mt-8 rounded-2xl border border-border bg-card p-6"><p className="font-semibold">Connectez-vous pour consulter les stocks de votre organisation.</p><Link href="/auth/login" className="btn-primary mt-4 inline-flex">Se connecter</Link></div>}
      {error && <p role="alert" className="mt-6 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">{error}</p>}
      {user && <><div className="mt-8 grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Références suivies</p><p className="mt-2 text-3xl font-black">{loading?'—':rows.length}</p></div><div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Quantité totale</p><p className="mt-2 text-3xl font-black">{loading?'—':totalUnits.toLocaleString('fr-FR')}</p></div><div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">Quantité disponible</p><p className="mt-2 text-3xl font-black">{loading?'—':availableUnits.toLocaleString('fr-FR')}</p></div></div>
      <section className="mt-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-2xl font-extrabold">État des stocks</h2><p className="mt-1 text-sm text-muted-foreground">Le seuil d’alerte est calculé sur la quantité disponible après réservations.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1.5 text-sm"><AlertTriangle size={15}/>{loading?'—':lowStock.length} sous le seuil</span></div>
      <div className="relative mt-5 max-w-xl"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/><input value={query} onChange={(e)=>setQuery(e.target.value)} className="jdv-input pl-9" placeholder="Rechercher par nom, code ou catégorie"/></div>
      {loading?<div className="mt-5 h-48 animate-pulse rounded-2xl border border-border bg-card"/>:filtered.length?<div className="mt-5 overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-muted/30 text-muted-foreground"><tr><th className="px-4 py-3">Article</th><th className="px-4 py-3">Quantité</th><th className="px-4 py-3">Réservée</th><th className="px-4 py-3">Disponible</th><th className="px-4 py-3">Seuil minimum</th><th className="px-4 py-3">État</th></tr></thead><tbody>{filtered.map((row)=><tr key={row.id} className="border-t border-border"><td className="px-4 py-3"><p className="font-semibold">{row.article?.name ?? 'Article sans libellé'}</p><p className="mt-1 text-xs text-muted-foreground">{row.article?.code ?? '—'}{row.article?.category ? ' · ' + row.article.category : ''}</p></td><td className="px-4 py-3 tabular-nums">{Number(row.quantity).toLocaleString('fr-FR')} {row.article?.unit ?? ''}</td><td className="px-4 py-3 tabular-nums">{Number(row.reserved_quantity).toLocaleString('fr-FR')}</td><td className="px-4 py-3 tabular-nums">{(Number(row.quantity)-Number(row.reserved_quantity)).toLocaleString('fr-FR')}</td><td className="px-4 py-3 tabular-nums">{Number(row.minimum_quantity).toLocaleString('fr-FR')}</td><td className="px-4 py-3">{Number(row.quantity)-Number(row.reserved_quantity)<=Number(row.minimum_quantity)?<span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning"><AlertTriangle size={12}/> À réapprovisionner</span>:<span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">Normal</span>}</td></tr>)}</tbody></table></div>:<div className="mt-5 rounded-2xl border border-dashed border-border p-10 text-center"><Warehouse size={30} className="mx-auto text-muted-foreground"/><p className="mt-3 font-semibold">Aucun stock à afficher</p><p className="mt-2 text-sm text-muted-foreground">Aucune référence visible avec les autorisations actuelles, ou aucun stock n’a encore été enregistré.</p></div>}
      </section></>}
      <p className="mt-10 text-xs leading-5 text-muted-foreground">Cette première vue est en lecture seule. Les entrées, sorties et transferts doivent utiliser les flux de mouvements existants et leurs contrôles d’autorisation; aucun ajustement direct du stock n’est proposé ici.</p>
    </section>
  </main>;
}
