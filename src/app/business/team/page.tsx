'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { getCurrentBusinessId } from '@/lib/business/current-business';

type Member = { id: string; user_id: string | null; role: string | null; is_active: boolean | null; created_at: string | null };
const roleLabel = (role: string | null) => {
  const labels: Record<string, string> = { OWNER: 'Propriétaire', ADMIN: 'Administrateur', MANAGER: 'Gestionnaire', MEMBER: 'Membre', STAFF: 'Personnel' };
  return role ? labels[role.toUpperCase()] ?? role : 'Non défini';
};
export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [rows, setRows] = useState<Member[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const loadMembers = useCallback(async () => {
    if (!user) return;
    setBusy(true); setError('');
    const id = await getCurrentBusinessId(supabase, user.id);
    if (!id) { setRows([]); setError('Aucune entreprise associée à ce compte.'); setBusy(false); return; }
    const { data, error: queryError } = await supabase.from('business_members').select('id,user_id,role,is_active,created_at').eq('business_id', id).order('created_at', { ascending: false }).limit(100);
    if (queryError) { setRows([]); setError('Impossible de charger les membres. Vérifiez vos droits d’accès puis réessayez.'); }
    else setRows((data ?? []) as Member[]);
    setBusy(false);
  }, [supabase, user]);
  useEffect(() => {
    if (!loading && !user) router.replace('/auth/login');
    if (!loading && user) void loadMembers();
  }, [loading, user, router, loadMembers]);
  if (loading || busy) return <main className="min-h-screen bg-[#0D1F3C] text-white grid place-items-center">Chargement de l’équipe…</main>;
  return <main className="min-h-screen bg-[#0D1F3C] text-white p-4 sm:p-6"><div className="mx-auto max-w-6xl">
    <Link href="/business" className="mb-6 inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"><ArrowLeft size={16}/> Retour au tableau de bord</Link>
    <div className="mb-6 flex items-center gap-3"><Users size={28} className="text-[#F97316]"/><div><h1 className="text-2xl font-bold">Équipe</h1><p className="mt-1 text-sm text-white/60">Les 100 derniers membres associés à votre entreprise.</p></div></div>
    {error && <p role="alert" className="mb-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">{error}</p>}
    <div className="overflow-x-auto rounded-xl border border-white/10"><table className="w-full text-left text-sm"><thead className="bg-white/5 text-white/70"><tr><th className="p-3 font-medium">Identifiant utilisateur</th><th className="p-3 font-medium">Rôle</th><th className="p-3 font-medium">Accès</th><th className="p-3 font-medium">Ajouté le</th></tr></thead><tbody>
    {rows.map((member) => <tr key={member.id} className="border-t border-white/10"><td className="p-3 font-mono text-xs text-white/75">{member.user_id ?? '—'}</td><td className="p-3">{roleLabel(member.role)}</td><td className="p-3"><span className={member.is_active ? 'rounded-full bg-emerald-400/15 px-2 py-1 text-emerald-200' : 'rounded-full bg-white/10 px-2 py-1 text-white/60'}>{member.is_active ? 'Actif' : 'Inactif'}</span></td><td className="p-3 text-white/65">{member.created_at ? new Date(member.created_at).toLocaleDateString('fr-FR') : '—'}</td></tr>)}
    </tbody></table>{rows.length === 0 && !error && <p className="p-8 text-center text-white/50">Aucun membre enregistré pour le moment.</p>}</div>
  </div></main>;
}
