'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Loader2, Phone, Mail, MapPin, Flame, Thermometer, Snowflake,
  Plus, CheckCircle2, MessageCircle, PhoneCall, Mail as MailIcon, Calendar,
  Truck, MoreHorizontal, UserCheck, X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Prospect {
  id: string;
  business_id: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  desired_product: string | null;
  requested_amount: number | null;
  temperature: 'hot' | 'warm' | 'cold';
  prospect_status: string;
  converted_client_id: string | null;
  next_follow_up_at: string | null;
  assigned_prospecteur_id: string | null;
}

interface Activity {
  id: string;
  activity_type: string;
  result: string | null;
  comment: string | null;
  created_at: string;
}

const TEMP_CONFIG: Record<string, { icon: typeof Flame; color: string; label: string }> = {
  hot: { icon: Flame, color: 'text-red-400 bg-red-400/10 border-red-400/20', label: 'Chaud' },
  warm: { icon: Thermometer, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20', label: 'Tiède' },
  cold: { icon: Snowflake, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', label: 'Froid' },
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Nouveau', contacted: 'Contacté', qualified: 'Qualifié',
  converted: 'Converti', lost: 'Perdu', archived: 'Archivé',
};

const ACTIVITY_TYPES: { value: string; label: string; icon: typeof PhoneCall }[] = [
  { value: 'call', label: 'Appel', icon: PhoneCall },
  { value: 'visit', label: 'Visite', icon: MapPin },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'email', label: 'Email', icon: MailIcon },
  { value: 'follow_up', label: 'Relance', icon: Calendar },
  { value: 'delivery', label: 'Livraison', icon: Truck },
  { value: 'other', label: 'Autre', icon: MoreHorizontal },
];

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function ProspectDetailPage() {
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState('call');
  const [activityComment, setActivityComment] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const prospectId = params?.id as string;
  const supabase = createClient();

  const load = useCallback(async () => {
    if (!user || !prospectId) return;
    const { data: p, error } = await supabase.from('crm_prospects').select('*').eq('id', prospectId).maybeSingle();
    if (error || !p) {
      toast.error("Prospect introuvable ou accès refusé");
      router.push('/crm/prospects');
      return;
    }
    setProspect(p as Prospect);

    const { data: acts } = await supabase
      .from('crm_prospect_activities')
      .select('id, activity_type, result, comment, created_at')
      .eq('prospect_id', prospectId)
      .order('created_at', { ascending: false });
    setActivities((acts || []) as Activity[]);
    setIsLoading(false);
  }, [user, prospectId, supabase, router]);

  useEffect(() => {
    if (!user) { router.push('/auth/login'); return; }
    load();
  }, [user, load, router]);

  const handleAddActivity = async () => {
    if (!prospect || !user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('crm_prospect_activities').insert({
        business_id: prospect.business_id,
        prospect_id: prospect.id,
        actor_user_id: user.id,
        activity_type: activityType,
        comment: activityComment.trim() || null,
        next_action_at: nextFollowUp ? new Date(nextFollowUp).toISOString() : null,
      });
      if (error) throw error;

      const updates: Record<string, unknown> = {
        last_contact_at: new Date().toISOString(),
        contact_count: undefined,
      };
      if (nextFollowUp) updates.next_follow_up_at = new Date(nextFollowUp).toISOString();
      if (prospect.prospect_status === 'new') updates.prospect_status = 'contacted';
      delete updates.contact_count;

      await supabase.from('crm_prospects').update(updates).eq('id', prospect.id);

      toast.success('Activité enregistrée');
      setShowActivityForm(false);
      setActivityComment('');
      setNextFollowUp('');
      await load();
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConvert = async () => {
    if (!prospect) return;
    setIsConverting(true);
    try {
      const { data, error } = await supabase.rpc('crm_convert_prospect_to_client', { p_prospect_id: prospect.id });
      if (error) throw error;
      toast.success('Prospect converti en client');
      if (data?.id) {
        router.push(`/business/clients`);
      } else {
        await load();
      }
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la conversion');
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading || !prospect) {
    return <div className="min-h-screen bg-[#0D1F3C] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F97316] animate-spin" /></div>;
  }

  const temp = TEMP_CONFIG[prospect.temperature];
  const TempIcon = temp.icon;
  const isConverted = prospect.prospect_status === 'converted';

  return (
    <div className="min-h-screen bg-[#0D1F3C]">
      <header className="border-b border-white/10 bg-[#0D1F3C]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/crm/prospects" className="text-white/60 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-white font-bold text-base leading-none truncate">{prospect.first_name} {prospect.last_name || ''}</h1>
            <p className="text-white/40 text-xs">JDV CRM · Fiche prospect</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${temp.color} shrink-0`}>
                <TempIcon size={22} />
              </div>
              <div>
                <h2 className="text-white text-xl font-bold">{prospect.first_name} {prospect.last_name || ''}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${temp.color}`}>{temp.label}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full border border-white/20 text-white/60">
                    {STATUS_LABELS[prospect.prospect_status] || prospect.prospect_status}
                  </span>
                </div>
              </div>
            </div>
            {!isConverted && (
              <button onClick={handleConvert} disabled={isConverting}
                className="flex items-center gap-2 bg-success hover:bg-success/90 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
                {isConverting ? <Loader2 size={16} className="animate-spin" /> : <UserCheck size={16} />}
                Convertir en client
              </button>
            )}
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
            {prospect.phone && (
              <div className="flex items-center gap-2 text-white/70 text-sm"><Phone size={14} className="text-white/40" /> {prospect.phone}</div>
            )}
            {prospect.email && (
              <div className="flex items-center gap-2 text-white/70 text-sm"><Mail size={14} className="text-white/40" /> {prospect.email}</div>
            )}
            {(prospect.address || prospect.city) && (
              <div className="flex items-center gap-2 text-white/70 text-sm"><MapPin size={14} className="text-white/40" /> {[prospect.address, prospect.city].filter(Boolean).join(', ')}</div>
            )}
            {prospect.desired_product && (
              <div className="text-white/70 text-sm"><span className="text-white/40">Produit :</span> {prospect.desired_product}</div>
            )}
            {prospect.requested_amount && (
              <div className="text-white/70 text-sm"><span className="text-white/40">Montant demandé :</span> {Number(prospect.requested_amount).toLocaleString('fr-FR')}</div>
            )}
            {prospect.next_follow_up_at && (
              <div className="text-white/70 text-sm"><span className="text-white/40">Prochaine relance :</span> {formatDateTime(prospect.next_follow_up_at)}</div>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm">Activités</h2>
            <button onClick={() => setShowActivityForm(true)} className="flex items-center gap-1.5 text-[#F97316] text-xs font-medium hover:underline">
              <Plus size={14} /> Ajouter
            </button>
          </div>

          {showActivityForm && (
            <div className="p-5 border-b border-white/10 bg-white/5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white text-sm font-medium">Nouvelle activité</p>
                <button onClick={() => setShowActivityForm(false)} className="text-white/40 hover:text-white"><X size={16} /></button>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {ACTIVITY_TYPES.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.value} onClick={() => setActivityType(t.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${activityType === t.value ? 'bg-[#F97316] border-[#F97316] text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}>
                      <Icon size={12} /> {t.label}
                    </button>
                  );
                })}
              </div>
              <textarea value={activityComment} onChange={(e) => setActivityComment(e.target.value)} placeholder="Commentaire..." rows={2}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#F97316] resize-none mb-3" />
              <div className="flex items-center gap-3 flex-wrap">
                <label className="text-white/50 text-xs">Prochaine relance :</label>
                <input type="datetime-local" value={nextFollowUp} onChange={(e) => setNextFollowUp(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-[#F97316]" />
              </div>
              <button onClick={handleAddActivity} disabled={isSaving}
                className="mt-4 w-full bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm">
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Enregistrer
              </button>
            </div>
          )}

          {activities.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={28} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40 text-sm">Aucune activité pour le moment</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {activities.map((a) => {
                const cfg = ACTIVITY_TYPES.find((t) => t.value === a.activity_type) || ACTIVITY_TYPES[6];
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon size={14} className="text-white/50" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-white text-sm font-medium">{cfg.label}</p>
                        <p className="text-white/30 text-xs shrink-0">{formatDateTime(a.created_at)}</p>
                      </div>
                      {a.comment && <p className="text-white/50 text-xs mt-1">{a.comment}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
