'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Boxes, Loader2, Save, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface StockRow {
  id: string;
  prospecteur_id: string;
  product_id: string;
  quantity: number;
  minimum_quantity: number;
  prospecteur_name: string;
  product_name: string;
  product_code: string | null;
}

export default function CrmStockPage() {
  const [rows, setRows] = useState<StockRow[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data: business, error: businessError } = await supabase
        .from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
      if (businessError) throw businessError;
      if (!business) {
        setBusinessId(null);
        setRows([]);
        return;
      }
      setBusinessId(business.id);
      const [stocksRes, prospecteursRes, productsRes] = await Promise.all([
        supabase.from('crm_prospecteur_stocks')
          .select('id, prospecteur_id, product_id, quantity, minimum_quantity')
          .eq('business_id', business.id).order('updated_at', { ascending: false }),
        supabase.from('crm_prospecteurs')
          .select('id, user_id, code, prospecteur_status')
          .eq('business_id', business.id),
        supabase.from('business_products')
          .select('id, name, code')
          .eq('business_id', business.id),
      ]);
      if (stocksRes.error) throw stocksRes.error;
      if (prospecteursRes.error) throw prospecteursRes.error;
      if (productsRes.error) throw productsRes.error;
      const prospecteurById = new Map((prospecteursRes.data || []).map((p: any) => [p.id, p]));
      const productById = new Map((productsRes.data || []).map((p: any) => [p.id, p]));
      setRows((stocksRes.data || []).map((stock: any) => {
        const prospecteur = prospecteurById.get(stock.prospecteur_id) as any;
        const product = productById.get(stock.product_id) as any;
        return {
          ...stock,
          prospecteur_name: prospecteur?.code || 'Prospecteur',
          product_name: product?.name || 'Produit indisponible',
          product_code: product?.code || null,
        } as StockRow;
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible de charger le stock.');
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    void load();
  }, [user, load, router]);

  const changeThreshold = (id: string, value: string) => {
    const parsed = value === '' ? 0 : Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setRows(current => current.map(row => row.id === id ? { ...row, minimum_quantity: parsed } : row));
  };

  const saveThreshold = async (row: StockRow) => {
    if (!businessId) return;
    setSavingId(row.id);
    try {
      const { error } = await supabase.from('crm_prospecteur_stocks')
        .update({ minimum_quantity: row.minimum_quantity })
        .eq('id', row.id)
        .eq('business_id', businessId);
      if (error) throw error;
      toast.success('Seuil minimum enregistré.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Impossible d’enregistrer le seuil.');
    } finally {
      setSavingId(null);
    }
  };

  const lowStockCount = rows.filter(row => Number(row.quantity) <= Number(row.minimum_quantity)).length;

  return (
    <div className="min-h-screen bg-[#0D1F3C] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
          <div className="flex items-center gap-3">
            <Link href="/crm" className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Retour au CRM">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <Boxes className="text-[#F97316]" size={20} />
              <div>
                <h1 className="text-base font-bold">Stock des prospecteurs</h1>
                <p className="text-xs text-white/40">Seuils de réapprovisionnement</p>
              </div>
            </div>
          </div>
          <button onClick={() => void load()} disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-sm text-white/70 hover:bg-white/10 disabled:opacity-50">
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#F97316]" size={30} /></div>
        ) : !businessId ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
            <Boxes className="mx-auto mb-3 text-white/25" size={32} />
            <h2 className="font-semibold">Espace entreprise introuvable</h2>
            <p className="mt-2 text-sm text-white/50">Cette vue de réglage est destinée au propriétaire de l’entreprise du CRM commercial.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div>
                <p className="text-sm font-semibold">Seuils minimums par produit attribué</p>
                <p className="mt-1 text-xs text-white/50">Une alerte est déclenchée lorsque la quantité atteint ou passe sous le seuil défini.</p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                <AlertTriangle size={16} /> {lowStockCount} stock(s) au seuil
              </div>
            </div>
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-sm text-white/50">Aucun stock attribué à un prospecteur pour le moment.</div>
            ) : rows.map(row => (
              <article key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-semibold">{row.product_name}</h2>
                    <p className="mt-1 text-xs text-white/45">
                      {row.product_code ? `Code : ${row.product_code} · ` : ''}Prospecteur : {row.prospecteur_name}
                    </p>
                    <p className={Number(row.quantity) <= Number(row.minimum_quantity) ? 'mt-2 text-sm font-medium text-amber-300' : 'mt-2 text-sm text-white/65'}>
                      Quantité actuelle : {Number(row.quantity).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex flex-col gap-1 text-xs text-white/50">
                      Seuil minimum
                      <input type="number" min="0" step="0.01" value={row.minimum_quantity}
                        onChange={event => changeThreshold(row.id, event.target.value)}
                        className="w-32 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:border-[#F97316] focus:outline-none" />
                    </label>
                    <button onClick={() => void saveThreshold(row)} disabled={savingId === row.id}
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#F97316] px-3 text-sm font-medium hover:bg-[#F97316]/90 disabled:opacity-50">
                      {savingId === row.id ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Enregistrer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </>
        )}
        <p className="text-xs text-white/35">Les droits de modification sont contrôlés par les règles de sécurité Supabase de l’entreprise.</p>
      </main>
    </div>
  );
}
