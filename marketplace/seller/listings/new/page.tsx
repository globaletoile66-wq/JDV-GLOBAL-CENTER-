'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, DollarSign, Tag, Image, Save, Loader2, AlertCircle, Plus, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Currency {
  id: string;
  code: string;
  symbol: string;
  name: string;
}

export default function NewListingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [categories, setCategories] = useState<Category[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    short_description: '',
    sku: '',
    price: '',
    compare_at_price: '',
    currency_id: '',
    stock_quantity: '0',
    track_inventory: true,
    allow_backorder: false,
    category_id: '',
    tags: [] as string[],
    is_digital: false,
    listing_status: 'draft\' as \'draft\' | \'published',
  });
  const [tagInput, setTagInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState('');

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [catRes, curRes, sellerRes] = await Promise.all([
        supabase.from('marketplace_categories').select('id, name, slug').eq('is_active', true).order('sort_order'),
        supabase.from('currencies').select('id, code, symbol, name').order('code'),
        supabase.from('marketplace_sellers').select('id').eq('user_id', user.id).single(),
      ]);

      setCategories((catRes.data as Category[]) || []);
      setCurrencies((curRes.data as Currency[]) || []);

      if (sellerRes.error || !sellerRes.data) {
        router.push('/marketplace/seller');
        return;
      }
      setSellerId(sellerRes.data.id);

      // Default currency
      const xof = (curRes.data as Currency[])?.find((c) => c.code === 'XOF');
      if (xof) setForm((prev) => ({ ...prev, currency_id: xof.id }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));

  const addImage = () => {
    const url = imageInput.trim();
    if (url && !imageUrls.includes(url)) setImageUrls((prev) => [...prev, url]);
    setImageInput('');
  };

  const removeImage = (url: string) => setImageUrls((prev) => prev.filter((u) => u !== url));

  const handleSubmit = async (status: 'draft' | 'published') => {
    if (!sellerId) return;
    if (!form.title || !form.price) { setError('Le titre et le prix sont obligatoires.'); return; }
    setSaving(true);
    setError(null);
    try {
      const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

      const { data: listing, error: listErr } = await supabase
        .from('marketplace_listings')
        .insert({
          seller_id: sellerId,
          title: form.title,
          slug,
          description: form.description || null,
          short_description: form.short_description || null,
          sku: form.sku || null,
          price: parseFloat(form.price),
          compare_at_price: form.compare_at_price ? parseFloat(form.compare_at_price) : null,
          currency_id: form.currency_id || null,
          stock_quantity: parseInt(form.stock_quantity) || 0,
          track_inventory: form.track_inventory,
          allow_backorder: form.allow_backorder,
          category_id: form.category_id || null,
          tags: form.tags,
          is_digital: form.is_digital,
          listing_status: status,
          published_at: status === 'published' ? new Date().toISOString() : null,
        })
        .select('id')
        .single();

      if (listErr) throw listErr;

      // Add images
      if (imageUrls.length > 0) {
        const mediaItems = imageUrls.map((url, idx) => ({
          listing_id: listing.id,
          url,
          media_type: 'image',
          sort_order: idx,
          is_primary: idx === 0,
        }));
        await supabase.from('marketplace_listing_media').insert(mediaItems);
      }

      setSuccess(true);
      setTimeout(() => router.push('/marketplace/seller'), 1500);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-accent" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/marketplace/seller" className="btn-ghost p-2 -ml-2"><ArrowLeft size={18} /></Link>
          <h1 className="font-bold text-foreground">Nouveau produit</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 w-full flex flex-col gap-6">
        {error && (
          <div className="bg-danger/10 border border-danger/20 rounded-2xl p-4 flex items-center gap-3">
            <AlertCircle size={16} className="text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-success/10 border border-success/20 rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 size={16} className="text-success flex-shrink-0" />
            <p className="text-sm text-success">Produit créé avec succès ! Redirection...</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main form */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Basic info */}
            <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Package size={14} className="text-accent" /> Informations de base
              </h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Titre du produit *</label>
                  <input
                    type="text"
                    placeholder="Ex: Téléphone Samsung Galaxy A54"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description courte</label>
                  <input
                    type="text"
                    placeholder="Résumé en une phrase"
                    value={form.short_description}
                    onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Description complète</label>
                  <textarea
                    placeholder="Décrivez votre produit en détail..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={5}
                    className="input-field resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Référence / SKU</label>
                  <input
                    type="text"
                    placeholder="Ex: SKU-001"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <DollarSign size={14} className="text-accent" /> Prix
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Prix de vente *</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Prix barré (optionnel)</label>
                  <input
                    type="number"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={form.compare_at_price}
                    onChange={(e) => setForm({ ...form, compare_at_price: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Devise</label>
                <select value={form.currency_id} onChange={(e) => setForm({ ...form, currency_id: e.target.value })} className="input-field">
                  <option value="">Sélectionner une devise</option>
                  {currencies.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} — {c.name} ({c.symbol})</option>
                  ))}
                </select>
              </div>
            </section>

            {/* Stock */}
            <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Package size={14} className="text-accent" /> Stock & Inventaire
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Quantité en stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="flex flex-col gap-2 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.track_inventory} onChange={(e) => setForm({ ...form, track_inventory: e.target.checked })} className="rounded" />
                    <span className="text-sm text-foreground">Suivre l'inventaire</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.allow_backorder} onChange={(e) => setForm({ ...form, allow_backorder: e.target.checked })} className="rounded" />
                    <span className="text-sm text-foreground">Autoriser les précommandes</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Images */}
            <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Image size={14} className="text-accent" /> Photos du produit
              </h2>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="URL de l'image (https://...)"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addImage()}
                  className="input-field flex-1 text-sm"
                />
                <button onClick={addImage} className="btn-outline px-3"><Plus size={14} /></button>
              </div>
              {imageUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {imageUrls.map((url, idx) => (
                    <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border group">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-accent/80 text-white text-xs text-center py-0.5">Principale</span>}
                      <button
                        onClick={() => removeImage(url)}
                        className="absolute top-1 right-1 w-5 h-5 bg-danger text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">La première image sera utilisée comme image principale.</p>
            </section>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            {/* Category & Tags */}
            <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4">
              <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Tag size={14} className="text-accent" /> Catégorie & Tags
              </h2>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Catégorie</label>
                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="input-field text-sm">
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Ajouter un tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTag()}
                    className="input-field flex-1 text-sm"
                  />
                  <button onClick={addTag} className="btn-outline px-3"><Plus size={14} /></button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 text-xs bg-accent/10 text-accent px-2 py-1 rounded-lg">
                        #{tag}
                        <button onClick={() => removeTag(tag)}><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_digital} onChange={(e) => setForm({ ...form, is_digital: e.target.checked })} className="rounded" />
                <span className="text-sm text-foreground">Produit numérique</span>
              </label>
            </section>

            {/* Actions */}
            <section className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
              <h2 className="font-bold text-foreground text-sm">Publication</h2>
              <button
                onClick={() => handleSubmit('published')}
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                Publier maintenant
              </button>
              <button
                onClick={() => handleSubmit('draft')}
                disabled={saving}
                className="btn-outline w-full flex items-center justify-center gap-2 text-sm"
              >
                <Save size={14} /> Enregistrer en brouillon
              </button>
              <Link href="/marketplace/seller" className="btn-ghost w-full text-center text-sm text-muted-foreground">
                Annuler
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
