'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserCheck, Plus, Search, Loader2, Phone, Mail, MapPin, Briefcase } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Client {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
}

interface ClientForm {
  first_name: string;
  last_name: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  notes: string;
}

export default function BusinessClientsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<ClientForm>({ first_name: '', last_name: '', company_name: '', email: '', phone: '', address: '', city: '', notes: '' });

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadBusiness = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (data) {
      setBusinessId(data.id);
      const { data: clientsData } = await supabase.from('business_clients').select('*').eq('business_id', data.id).order('created_at', { ascending: false });
      setClients(clientsData || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadBusiness();
  }, [user, loadBusiness]);

  const handleSave = async () => {
    if (!businessId) return;
    if (!form.first_name.trim() && !form.company_name.trim()) { toast.error('Nom ou raison sociale requis'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('business_clients').insert({
        business_id: businessId,
        first_name: form.first_name.trim() || null,
        last_name: form.last_name.trim() || null,
        company_name: form.company_name.trim() || null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        notes: form.notes.trim() || null,
        is_active: true,
      });
      if (error) throw error;
      toast.success('Client ajouté');
      setShowForm(false);
      setForm({ first_name: '', last_name: '', company_name: '', email: '', phone: '', address: '', city: '', notes: '' });
      await loadBusiness();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.first_name || '').toLowerCase().includes(q) ||
      (c.last_name || '').toLowerCase().includes(q) ||
      (c.company_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q);
  });

  const getClientName = (c: Client) => c.company_name || `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Client sans nom';
  const getInitials = (c: Client) => {
    const name = getClientName(c);
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  };

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
                <h1 className="text-white font-bold text-base leading-none">Clients</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS · {clients.length} client{clients.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Nouveau client
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client..." className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors" />
        </div>

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Nouveau client</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: 'Prénom', field: 'first_name' as const, placeholder: 'Jean' },
                { label: 'Nom', field: 'last_name' as const, placeholder: 'Dupont' },
                { label: 'Raison sociale', field: 'company_name' as const, placeholder: 'Mon Entreprise SARL' },
                { label: 'Email', field: 'email' as const, placeholder: 'client@email.com' },
                { label: 'Téléphone', field: 'phone' as const, placeholder: '+229 XX XX XX XX' },
                { label: 'Ville', field: 'city' as const, placeholder: 'Cotonou' },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-white/60 text-xs mb-1.5">{label}</label>
                  <input type="text" value={form[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))} placeholder={placeholder} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="block text-white/60 text-xs mb-1.5">Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Notes sur ce client..." rows={2} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] resize-none" />
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
            <UserCheck size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base">{search ? 'Aucun résultat' : 'Aucun client enregistré'}</p>
            <p className="text-white/30 text-sm mt-1">{search ? 'Essayez un autre terme' : 'Ajoutez votre premier client'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 text-[#F97316] text-sm hover:underline">
                <Plus size={14} /> Nouveau client
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(client => (
              <div key={client.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/8 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#F97316]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#F97316] text-sm font-bold">{getInitials(client)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-medium text-sm truncate">{getClientName(client)}</p>
                    {client.company_name && (client.first_name || client.last_name) && (
                      <p className="text-white/40 text-xs truncate">{client.first_name} {client.last_name}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {client.phone && (
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <Phone size={12} className="flex-shrink-0" />
                      <span className="truncate">{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <Mail size={12} className="flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.city && (
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">{client.city}</span>
                    </div>
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
