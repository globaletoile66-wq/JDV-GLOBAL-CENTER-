'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, Plus, Search, Loader2, Briefcase, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Appointment {
  id: string;
  title: string;
  description: string | null;
  appointment_status: string;
  start_at: string;
  end_at: string | null;
  location: string | null;
  client_name?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  scheduled: { label: 'Planifié', color: 'text-info bg-info/10 border-info/20', icon: <Clock size={12} /> },
  confirmed: { label: 'Confirmé', color: 'text-success bg-success/10 border-success/20', icon: <CheckCircle2 size={12} /> },
  completed: { label: 'Terminé', color: 'text-white/60 bg-white/10 border-white/20', icon: <CheckCircle2 size={12} /> },
  cancelled: { label: 'Annulé', color: 'text-danger bg-danger/10 border-danger/20', icon: <XCircle size={12} /> },
  no_show: { label: 'Absent', color: 'text-warning bg-warning/10 border-warning/20', icon: <AlertTriangle size={12} /> },
};

export default function BusinessAppointmentsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_at: '', end_at: '', location: '' });

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: biz } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (!biz) { setIsLoading(false); return; }
    setBusinessId(biz.id);

    const { data } = await supabase
      .from('business_appointments')
      .select('*, business_clients(first_name, last_name, company_name)')
      .eq('business_id', biz.id)
      .order('start_at', { ascending: true });

    const mapped = (data || []).map((a: any) => ({
      ...a,
      client_name: a.business_clients
        ? a.business_clients.company_name || `${a.business_clients.first_name || ''} ${a.business_clients.last_name || ''}`.trim()
        : null,
    }));
    setAppointments(mapped);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user, loadData]);

  const handleSave = async () => {
    if (!businessId || !form.title.trim() || !form.start_at) { toast.error('Titre et date requis'); return; }
    setIsSaving(true);
    try {
      const { error } = await supabase.from('business_appointments').insert({
        business_id: businessId,
        created_by: user!.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        start_at: form.start_at,
        end_at: form.end_at || null,
        location: form.location.trim() || null,
        appointment_status: 'scheduled',
      });
      if (error) throw error;
      toast.success('Rendez-vous créé');
      setShowForm(false);
      setForm({ title: '', description: '', start_at: '', end_at: '', location: '' });
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = appointments.filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()) || (a.client_name || '').toLowerCase().includes(search.toLowerCase()));
  const upcoming = filtered.filter(a => new Date(a.start_at) >= new Date() && a.appointment_status !== 'cancelled');
  const past = filtered.filter(a => new Date(a.start_at) < new Date() || a.appointment_status === 'cancelled');

  if (isLoading) {
    return <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>;
  }

  const AppointmentCard = ({ appt }: { appt: Appointment }) => {
    const cfg = STATUS_CONFIG[appt.appointment_status] || STATUS_CONFIG.scheduled;
    return (
      <div className="p-4 flex items-start gap-4 hover:bg-white/5 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Calendar size={18} className="text-info" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-white font-medium text-sm truncate">{appt.title}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border inline-flex items-center gap-1 flex-shrink-0 ${cfg.color}`}>
              {cfg.icon}{cfg.label}
            </span>
          </div>
          <p className="text-white/40 text-xs">
            {new Date(appt.start_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            {appt.client_name && ` · ${appt.client_name}`}
            {appt.location && ` · ${appt.location}`}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/business" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"><ArrowLeft size={18} /></Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#F97316] flex items-center justify-center"><Briefcase size={14} className="text-white" /></div>
              <div>
                <h1 className="text-white font-bold text-base leading-none">Rendez-vous</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS · {upcoming.length} à venir</p>
              </div>
            </div>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-[#F97316] hover:bg-[#F97316]/90 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus size={16} /> Nouveau
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un rendez-vous..." className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors" />
        </div>

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Nouveau rendez-vous</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="sm:col-span-2">
                <label className="block text-white/60 text-xs mb-1.5">Titre *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Réunion client" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Début *</label>
                <input type="datetime-local" value={form.start_at} onChange={e => setForm(p => ({ ...p, start_at: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Fin</label>
                <input type="datetime-local" value={form.end_at} onChange={e => setForm(p => ({ ...p, end_at: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#F97316]" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-white/60 text-xs mb-1.5">Lieu</label>
                <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Adresse ou lien de réunion" className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316]" />
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
            <Calendar size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base">{search ? 'Aucun résultat' : 'Aucun rendez-vous'}</p>
            {!search && (
              <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 text-[#F97316] text-sm hover:underline">
                <Plus size={14} /> Nouveau rendez-vous
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2 px-1">À venir</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
                  {upcoming.map(a => <AppointmentCard key={a.id} appt={a} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-2 px-1">Passés</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5 opacity-70">
                  {past.map(a => <AppointmentCard key={a.id} appt={a} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
