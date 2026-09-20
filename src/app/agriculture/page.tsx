'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Search, Tractor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type AgricultureFarm = {
  id: string;
  name: string;
  crop_type?: string | null;
  area_hectares?: number | null;
  location?: string | null;
  status?: string | null;
};

type AgricultureProduct = {
  id: string;
  name: string;
  product_type?: string | null;
  quantity?: number | null;
  unit?: string | null;
  status?: string | null;
};

export default function AgriculturePage() {
  const { user, loading } = useAuth();
  const [farms, setFarms] = useState<AgricultureFarm[]>([]);
  const [products, setProducts] = useState<AgricultureProduct[]>([]);
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const supabase = createClient();

  const load = useCallback(async () => {
    if (!user) {
      setFarms([]);
      setProducts([]);
      setBusy(false);
      return;
    }

    setBusy(true);
    setError('');

    const [farmsResult, productsResult] = await Promise.all([
      supabase.from('agriculture_farms').select('*').limit(100),
      supabase.from('agriculture_products').select('*').limit(100),
    ]);

    if (farmsResult.error || productsResult.error) {
      setError(
        farmsResult.error?.message ||
          productsResult.error?.message ||
          'Erreur lors du chargement des données agricoles.',
      );
    } else {
      setFarms((farmsResult.data || []) as AgricultureFarm[]);
      setProducts((productsResult.data || []) as AgricultureProduct[]);
    }

    setBusy(false);
  }, [supabase, user]);

  useEffect(() => {
    if (!loading) {
      void load();
    }
  }, [load, loading]);

  const filteredProducts = products.filter((product) =>
    JSON.stringify(product).toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-[#0B1B3D] p-5 text-white sm:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white/60 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Accueil
          </Link>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 transition hover:bg-white/5"
          >
            <RefreshCw size={16} className={busy ? 'animate-spin' : ''} />
            Actualiser
          </button>
        </div>

        <section className="mt-7 rounded-3xl border border-white/10 bg-white/[.06] p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#F28C28]/10 p-3 text-[#F28C28]">
              <Tractor size={24} />
            </div>

            <div>
              <p className="text-xs uppercase tracking-[.25em] text-[#F28C28]">
                JDV GLOBAL CENTER
              </p>
              <h1 className="text-3xl font-black">JDV AGRICULTURE</h1>
            </div>
          </div>

          <p className="mt-3 text-white/60">
            Exploitations agricoles, productions et commercialisation.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-sm text-white/45">Exploitations</div>
              <div className="mt-1 text-3xl font-bold">{farms.length}</div>
            </div>

            <div className="rounded-2xl border border-white/10 p-5">
              <div className="text-sm text-white/45">Produits</div>
              <div className="mt-1 text-3xl font-bold">{products.length}</div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3">
            <Search size={17} className="text-white/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit…"
              className="w-full bg-transparent outline-none placeholder:text-white/30"
            />
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
              {error}
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product.id}
                  className="rounded-2xl border border-white/10 bg-white/[.04] p-5"
                >
                  <h2 className="font-bold">{product.name}</h2>
                  <p className="mt-1 text-sm text-white/50">
                    {product.product_type || 'Production agricole'}
                  </p>
                  <div className="mt-4 text-xl font-bold">
                    {product.quantity ?? 0} {product.unit || ''}
                  </div>
                  <div className="mt-2 text-xs text-[#F28C28]">
                    {product.status || '—'}
                  </div>
                </article>
              ))}

              {!busy && filteredProducts.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/15 p-10 text-center text-white/45">
                  Aucune donnée agricole opérationnelle enregistrée.
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
