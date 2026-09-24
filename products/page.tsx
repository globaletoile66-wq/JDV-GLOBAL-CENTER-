'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus, Search, Loader2, ToggleLeft, ToggleRight, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  unit: string | null;
  price: number;
  cost_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  is_service: boolean;
  image_url: string | null;
}

interface NewProductForm {
  name: string;
  code: string;
  description: string;
  unit: string;
  price: string;
  cost_price: string;
  stock_quantity: string;
  is_service: boolean;
}

export default function BusinessProductsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');
  const [form, setForm] = useState<NewProductForm>({
    name: '', code: '', description: '', unit: '', price: '', cost_price: '', stock_quantity: '0', is_service: false,
  });

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadBusiness = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (data) {
      setBusinessId(data.id);
      await loadProducts(data.id);
    }
    setIsLoading(false);
  }, [user]);

  const loadProducts = async (bId: string) => {
    const { data, error } = await supabase
      .from('business_products')
      .select('*')
      .eq('business_id', bId)
      .order('name');
    if (!error) setProducts(data || []);
  };

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadBusiness();
  }, [user, loadBusiness]);

  const handleSave = async () => {
    if (!businessId || !form.name.trim()) { toast.error('Le nom est requis'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('business_products').insert({
        business_id: businessId,
        name: form.name.trim(),
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        unit: form.unit.trim() || null,
        price: parseFloat(form.price) || 0,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
        stock_quantity: parseFloat(form.stock_quantity) || 0,
        is_service: form.is_service,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Produit ajouté avec succès');
      setShowForm(false);
      setForm({ name: '', code: '', description: '', unit: '', price: '', cost_price: '', stock_quantity: '0', is_service: false });
      await loadProducts(businessId);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de l\'ajout');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (product: Product) => {
    const { error } = await supabase.from('business_products').update({ is_active: !product.is_active }).eq('id', product.id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(product.is_active ? 'Produit désactivé' : 'Produit activé');
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.code || '').toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || (filterType === 'service' ? p.is_service : !p.is_service);
    return matchSearch && matchType;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F97316] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/business" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
              <ArrowLeft size={18} />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center">
                <Briefcase size={14} className="text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Produits & Services</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un produit ou service..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'product', 'service'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${filterType === type ? 'bg-[#F97316] text-white' : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'}`}
              >
                {type === 'all' ? 'Tous' : type === 'product' ? 'Produits' : 'Services'}
              </button>
            ))}
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Nouveau produit / service</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Nom *</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nom du produit" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Code / Référence</label>
                <input type="text" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="REF-001" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Prix de vente (F CFA)</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} placeholder="0" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Prix de revient (F CFA)</label>
                <input type="number" value={form.cost_price} onChange={e => setForm(p => ({ ...p, cost_price: e.target.value }))} placeholder="0" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Unité</label>
                <input type="text" value={form.unit} onChange={e => setForm(p => ({ ...p, unit: e.target.value }))} placeholder="pièce, kg, litre..." className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Stock initial</label>
                <input type="number" value={form.stock_quantity} onChange={e => setForm(p => ({ ...p, stock_quantity: e.target.value }))} placeholder="0" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-white/60 text-xs mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Description du produit ou service..." rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] resize-none" />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setForm(p => ({ ...p, is_service: !p.is_service }))} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${form.is_service ? 'bg-info/20 text-info border border-info/30' : 'bg-white/10 text-white/60 border border-white/20'}`}>
                {form.is_service ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {form.is_service ? 'Service' : 'Produit physique'}
              </button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 text-sm transition-colors">Annuler</button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-xl text-sm transition-colors">
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        )}

        {/* Products list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base">{search ? 'Aucun résultat' : 'Aucun produit ou service'}</p>
            <p className="text-white/30 text-sm mt-1">{search ? 'Essayez un autre terme' : 'Ajoutez votre premier produit ou service'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 text-[#F97316] text-sm hover:underline">
                <Plus size={14} /> Ajouter un produit
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(product => (
              <div key={product.id} className={`bg-white/5 border rounded-xl p-4 transition-colors ${product.is_active ? 'border-white/10' : 'border-white/5 opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${product.is_service ? 'bg-info/10' : 'bg-warning/10'}`}>
                      {product.is_service ? <Briefcase size={14} className="text-info" /> : <Package size={14} className="text-warning" />}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${product.is_service ? 'text-info bg-info/10 border-info/20' : 'text-warning bg-warning/10 border-warning/20'}`}>
                      {product.is_service ? 'Service' : 'Produit'}
                    </span>
                  </div>
                  <button onClick={() => toggleActive(product)} className="text-white/30 hover:text-white transition-colors">
                    {product.is_active ? <ToggleRight size={18} className="text-success" /> : <ToggleLeft size={18} />}
                  </button>
                </div>
                <h3 className="text-white font-medium text-sm mb-1 truncate">{product.name}</h3>
                {product.code && <p className="text-white/40 text-xs mb-2">Réf: {product.code}</p>}
                <div className="flex items-center justify-between">
                  <p className="text-[#F97316] font-bold text-base">{new Intl.NumberFormat('fr-FR').format(product.price)} F</p>
                  {!product.is_service && (
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${product.stock_quantity <= 0 ? 'text-danger bg-danger/10 border-danger/20' : 'text-success bg-success/10 border-success/20'}`}>
                      Stock: {product.stock_quantity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
