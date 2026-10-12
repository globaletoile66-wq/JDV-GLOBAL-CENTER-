'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarDays, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type AppointmentRow = { id: string; title: string; start_at: string; end_at: string | null; appointment_status: string; location: string | null };

const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Planifié',
  confirmed: 'Confirmé',
  completed: 'Terminé',
  cancelled: 'Annulé',
  no_show: 'Absent',
  missed: 'Absent',
};

function getAppointmentStatusLabel(status: string): string {
  return APPOINTMENT_STATUS_LABELS[status] ?? status;
}

export default function BusinessAppointmentsPage() {
  const { user, loading } = useAuth(); const router = useRouter(); const supabase = createClient();
  const [rows, setRows] = useState<AppointmentRow[]>([]); const [busy, setBusy] = useState(true); const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    async function load() {
      if (loading) return;
      if (!user) { router.replace('/auth/login'); return; }
      setBusy(true); setError('');
      try {
        const businessId = await getCurrentBusinessId(supabase, user.id);
        if (!businessId) throw new Error('Aucune entreprise associée à votre compte.');
        const { data, error: queryError } = await supabase.from('business_appointments').select('id,title,start_at,end_at,appointment_status,location').eq('business_id', businessId).order('start_at', { ascending: true }).limit(100);
        if (queryError) throw queryError;
        if (active) setRows((data || []) as AppointmentRow[]);
      } catch (e) { if (active) setError(e instanceof Error ? e.message : 'Impossible de charger les rendez-vous.'); }
      finally { if (active) setBusy(false); }
    }
    void load(); return () => { active = false; };
  }, [user, loading, router, supabase]);
  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement des rendez-vous…</main>;
  return <main className="min-h-screen bg-[#0D1F3C] text-white p-6"><div className="max-w-6xl mx-auto">
    <Link href="/business" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"><ArrowLeft size={16}/>Retour au tableau de bord</Link>
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-2xl font-bold">Rendez-vous</h1><p className="mt-1 text-sm text-white/55">{rows.length} rendez-vous affiché(s), maximum 100</p></div><Link href="/business/appointments/new" className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] px-4 py-2.5 font-semibold"><Plus size={17}/>Nouveau rendez-vous</Link></div>
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-100">{error}</p>}
    <div className="mt-6 overflow-auto rounded-xl border border-white/10"><table className="w-full text-sm text-left"><thead className="bg-white/5 text-white/65"><tr><th className="p-3">Objet</th><th className="p-3">Début</th><th className="p-3">Fin</th><th className="p-3">Lieu</th><th className="p-3">Statut</th></tr></thead><tbody>
      {rows.map(r=><tr key={r.id} className="border-t border-white/10"><td className="p-3 font-medium">{r.title}</td><td className="p-3">{new Date(r.start_at).toLocaleString('fr-FR')}</td><td className="p-3">{r.end_at?new Date(r.end_at).toLocaleString('fr-FR'):'—'}</td><td className="p-3">{r.location||'—'}</td><td className="p-3">{getAppointmentStatusLabel(r.appointment_status)}</td></tr>)}
    </tbody></table>{!error && rows.length===0 && <div className="p-10 text-center text-white/55"><CalendarDays size={28} className="mx-auto mb-3 opacity-60"/><p>Aucun rendez-vous planifié.</p><Link className="inline-block mt-3 text-orange-300 hover:underline" href="/business/appointments/new">Planifier un premier rendez-vous</Link></div>}</div>
  </div></main>;
}
