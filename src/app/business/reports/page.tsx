'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type ReportData = {
  sales: number;
  revenue: number;
  clients: number;
  products: number;
};

export default function BusinessReportsPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState<ReportData>({
    sales: 0,
    revenue: 0,
    clients: 0,
    products: 0,
  });
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      if (!user || loading) {
        return;
      }

      setBusy(true);

      try {
        const supabase = createClient();
        const businessId = await getCurrentBusinessId(supabase, user.id);

        if (!businessId) {
          setData({
            sales: 0,
            revenue: 0,
            clients: 0,
            products: 0,
          });
          return;
        }

        const [salesResult, clientsResult, productsResult] =
          await Promise.all([
            supabase
              .from('business_sales')
              .select('total_amount')
              .eq('business_id', businessId),
            supabase
              .from('business_clients')
              .select('id', { count: 'exact', head: true })
              .eq('business_id', businessId),
            supabase
              .from('business_products')
              .select('id', { count: 'exact', head: true })
              .eq('business_id', businessId),
          ]);

        const sales = salesResult.data || [];

        setData({
          sales: sales.length,
          revenue: sales.reduce(
            (total, sale) => total + Number(sale.total_amount || 0),
            0,
          ),
          clients: clientsResult.count || 0,
          products: productsResult.count || 0,
        });
      } finally {
        setBusy(false);
      }
    };

    void loadReports();
  }, [loading, user]);

  if (loading || busy) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0D1F3C] text-white">
        Chargement…
      </main>
    );
  }

  const cards: Array<[keyof ReportData, string]> = [
    ['sales', 'Ventes'],
    ['revenue', 'Chiffre d’affaires'],
    ['clients', 'Clients'],
    ['products', 'Produits'],
  ];

  return (
    <main className="min-h-screen bg-[#0D1F3C] p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/business"
          className="mb-6 inline-flex items-center gap-2 text-white/60 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Retour
        </Link>

        <h1 className="text-2xl font-bold">Rapports JDV BUSINESS</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(([key, label]) => (
            <div
              key={key}
              className="rounded-xl border border-white/10 bg-white/5 p-5"
            >
              <p className="text-white/50">{label}</p>
              <p className="mt-2 text-2xl font-bold">
                {key === 'revenue'
                  ? data[key].toLocaleString('fr-FR')
                  : data[key]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
