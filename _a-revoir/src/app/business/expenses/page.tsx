'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, DollarSign, Plus, Search, Loader2, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Expense {
  id: string;
  category: string | null;
  description: string;
  amount: number;
  expense_status: string;
  expense_date: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-warning bg-warning/10 border-warning/20' },
  approved: { label: 'Approuvée', color: 'text-info bg-info/10 border-info/20' },
  rejected: { label: 'Rejetée', color: 'text-danger bg-danger/10 border-danger/20' },
  paid: { label: 'Payée', color: 'text-success bg-success/10 border-success/20' },
};

export default function BusinessExpensesPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', category: '', expense_date: new Date().toISOString().split('T')[0] });

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: biz } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (!biz) { setIsLoading(false); return; }
    setBusinessId(biz.id);
    const { data } = await supabase.from('business_expenses').select('*').eq('business_id', biz.id).order('expense_date', { ascending: false });
    setExpenses(data || []);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user, loadData]);

  const handleSave = async () => {
    if (!businessId || !form.description.trim()) { toast.error('Description requise'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('business_expenses').insert({
        business_id: businessId,
        created_by: user!.id,
        description: form.description.trim(),
        amount: parseFloat(form.amount) || 0,
        category: form.category.trim() || null,
        expense_date: form.expense_date,
        expense_status: 'pending',
      });
      if (error) throw error;
      toast.success('Dépense enregistrée');
      setShowForm(false);
      setForm({ description: '', amount: '', category: '', expense_date: new Date().toISOString().split('T')[0] });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = expenses.filter(e => !search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.category || '').toLowerCase().includes(search.toLowerCase()));
  const totalPaid = expenses.filter(e => e.expense_status === 'paid').reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.expense_status === 'pending').reduce((s, e) => s + e.amount, 0);

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/business" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center"><Briefcase size={14} className="text-white" /></div>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Dépenses</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Nouvelle dépense
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-danger/5 border border-danger/20 rounded-xl p-4">
            <p className="text-danger text-xs mb-1">Dépenses payées</p>
            <p className="text-white font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(totalPaid)} F</p>
          </div>
          <div className="bg-warning/5 border border-warning/20 rounded-xl p-4">
            <p className="text-warning text-xs mb-1">En attente</p>
            <p className="text-white font-bold text-lg">{new Intl.NumberFormat('fr-FR').format(totalPending)} F</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher une dépense..." className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors" />
        </div>

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Nouvelle dépense</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-white/60 text-xs mb-1.5">Description *</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Ex: Achat fournitures bureau" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Montant (F CFA)</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Catégorie</label>
                <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="Ex: Fournitures, Transport..." className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Date</label>
                <input type="date" value={form.expense_date} onChange={e => setForm(p => ({ ...p, expense_date: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
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

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base">{search ? 'Aucun résultat' : 'Aucune dépense enregistrée'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 text-[#F97316] text-sm hover:underline">
                <Plus size={14} /> Nouvelle dépense
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
            {filtered.map(expense => {
              const cfg = STATUS_CONFIG[expense.expense_status] || STATUS_CONFIG.pending;
              return (
                <div key={expense.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={18} className="text-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{expense.description}</p>
                    <p className="text-white/40 text-xs">
                      {expense.category && `${expense.category} · `}
                      {new Date(expense.expense_date).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-danger font-bold text-sm">-{new Intl.NumberFormat('fr-FR').format(expense.amount)} F</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
