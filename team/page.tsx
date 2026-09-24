'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, Loader2, Briefcase, Shield, Crown, Eye, UserMinus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  joined_at: string;
  profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  OWNER: { label: 'Propriétaire', color: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20', icon: <Crown size={12} /> },
  ADMIN: { label: 'Administrateur', color: 'text-danger bg-danger/10 border-danger/20', icon: <Shield size={12} /> },
  MANAGER: { label: 'Manager', color: 'text-info bg-info/10 border-info/20', icon: <Briefcase size={12} /> },
  ACCOUNTANT: { label: 'Comptable', color: 'text-success bg-success/10 border-success/20', icon: <Briefcase size={12} /> },
  SALES: { label: 'Commercial', color: 'text-warning bg-warning/10 border-warning/20', icon: <Briefcase size={12} /> },
  CASHIER: { label: 'Caissier', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20', icon: <Briefcase size={12} /> },
  EMPLOYEE: { label: 'Employé', color: 'text-white/60 bg-white/10 border-white/20', icon: <Users size={12} /> },
  VIEWER: { label: 'Lecteur', color: 'text-white/40 bg-white/5 border-white/10', icon: <Eye size={12} /> },
};

export default function BusinessTeamPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('VIEWER');

  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data: biz } = await supabase.from('business_profiles').select('id').eq('owner_user_id', user.id).maybeSingle();
    if (!biz) { setIsLoading(false); return; }
    setBusinessId(biz.id);

    const { data: membersData } = await supabase
      .from('business_members')
      .select('*')
      .eq('business_id', biz.id)
      .order('joined_at');

    if (membersData) {
      const withProfiles = await Promise.all(
        membersData.map(async (m) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, email, avatar_url')
            .eq('id', m.user_id)
            .maybeSingle();
          if (m.user_id === user.id) setCurrentUserRole(m.role);
          return { ...m, profile: profile || undefined };
        })
      );
      setMembers(withProfiles);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    loadData();
  }, [user, loadData]);

  const toggleMember = async (member: TeamMember) => {
    if (member.role === 'OWNER') { toast.error('Impossible de désactiver le propriétaire'); return; }
    if (!['OWNER', 'ADMIN'].includes(currentUserRole)) { toast.error('Permission insuffisante'); return; }
    const { error } = await supabase.from('business_members').update({ is_active: !member.is_active }).eq('id', member.id);
    if (!error) {
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_active: !m.is_active } : m));
      toast.success(member.is_active ? 'Membre désactivé' : 'Membre réactivé');
    }
  };

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = `${m.profile?.first_name || ''} ${m.profile?.last_name || ''}`.toLowerCase();
    return name.includes(q) || (m.profile?.email || '').toLowerCase().includes(q);
  });

  const getMemberName = (m: TeamMember) => {
    if (m.profile?.first_name || m.profile?.last_name) {
      return `${m.profile.first_name || ''} ${m.profile.last_name || ''}`.trim();
    }
    return m.profile?.email || 'Utilisateur inconnu';
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
                <h1 className="text-white font-bold text-base leading-none">Équipe</h1>
                <p className="text-white/40 text-xs">JDV BUSINESS · {members.length} membre{members.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un membre..." className="w-full bg-white/10 border border-white/20 rounded-xl pl-9 pr-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] transition-colors" />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Users size={40} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-base">Aucun membre trouvé</p>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-xl divide-y divide-white/5">
            {filtered.map(member => {
              const roleCfg = ROLE_CONFIG[member.role] || ROLE_CONFIG.VIEWER;
              return (
                <div key={member.id} className={`p-4 flex items-center gap-4 ${!member.is_active ? 'opacity-50' : ''}`}>
                  <div className="w-10 h-10 rounded-full bg-[#F97316]/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#F97316] text-sm font-bold">
                      {getMemberName(member).split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white font-medium text-sm truncate">{getMemberName(member)}</p>
                      {member.user_id === user?.id && <span className="text-xs text-white/30">(vous)</span>}
                    </div>
                    <p className="text-white/40 text-xs truncate">{member.profile?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-1 rounded-full border inline-flex items-center gap-1 ${roleCfg.color}`}>
                      {roleCfg.icon}{roleCfg.label}
                    </span>
                    {member.role !== 'OWNER' && ['OWNER', 'ADMIN'].includes(currentUserRole) && (
                      <button onClick={() => toggleMember(member)} className="text-white/30 hover:text-white transition-colors p-1">
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <p className="text-white/40 text-xs text-center">
            Pour inviter des membres, utilisez le système d'invitation de votre organisation depuis{' '}
            <Link href="/organizations" className="text-[#F97316] hover:underline">Mes organisations</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
