'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, CheckCircle2, Clock, AlertCircle, Upload, Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

interface KycProfile {
  id: string;
  kyc_level: string;
  kyc_status: string;
  verification_date: string | null;
  expiration_date: string | null;
}

const LEVEL_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode; description: string; limits: string }> = {
  unverified: {
    label: 'Non vérifié',
    color: 'text-danger',
    bgColor: 'bg-danger/10 border-danger/20',
    icon: <AlertCircle size={20} />,
    description: 'Votre identité n\'a pas encore été vérifiée.',
    limits: 'Accès limité aux fonctionnalités de paiement.',
  },
  basic: {
    label: 'Basique',
    color: 'text-warning',
    bgColor: 'bg-warning/10 border-warning/20',
    icon: <Clock size={20} />,
    description: 'Vérification basique complétée.',
    limits: 'Limites de transaction partielles.',
  },
  verified: {
    label: 'Vérifié',
    color: 'text-success',
    bgColor: 'bg-success/10 border-success/20',
    icon: <CheckCircle2 size={20} />,
    description: 'Votre identité a été vérifiée avec succès.',
    limits: 'Accès complet aux fonctionnalités JDV PAY.',
  },
  enhanced: {
    label: 'Renforcé',
    color: 'text-accent',
    bgColor: 'bg-accent/10 border-accent/20',
    icon: <Shield size={20} />,
    description: 'Vérification renforcée complétée.',
    limits: 'Limites maximales de transaction.',
  },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'text-muted-foreground' },
  under_review: { label: 'En cours d\'examen', color: 'text-warning' },
  approved: { label: 'Approuvé', color: 'text-success' },
  rejected: { label: 'Rejeté', color: 'text-danger' },
  expired: { label: 'Expiré', color: 'text-danger' },
};

export default function KYCPage() {
  const [kycProfile, setKycProfile] = useState<KycProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docType, setDocType] = useState('national_id');
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const loadKyc = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data } = await supabase.from('kyc_profiles').select('*').eq('user_id', user.id).maybeSingle();
      setKycProfile(data);
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!user) { router.push('/auth/login?redirect=/pay/kyc'); return; }
    loadKyc();
  }, [user, loadKyc, router]);

  const handleInitKyc = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { data: existing } = await supabase.from('kyc_profiles').select('id').eq('user_id', user.id).maybeSingle();
      if (!existing) {
        const { error } = await supabase.from('kyc_profiles').insert({
          user_id: user.id,
          kyc_level: 'unverified',
          kyc_status: 'pending',
        });
        if (error) throw error;
      }
      toast.success('Dossier KYC initialisé');
      loadKyc();
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de l\'initialisation');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-accent" />
      </div>
    );
  }

  const level = kycProfile?.kyc_level || 'unverified';
  const levelConf = LEVEL_CONFIG[level] || LEVEL_CONFIG.unverified;
  const statusConf = STATUS_CONFIG[kycProfile?.kyc_status || 'pending'] || STATUS_CONFIG.pending;

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-4 gap-3">
        <Link href="/pay" className="btn-ghost p-2"><ArrowLeft size={18} /></Link>
        <AppLogo size={24} />
        <div>
          <p className="text-xs text-muted-foreground">JDV PAY</p>
          <p className="text-sm font-semibold text-foreground">Vérification d'identité (KYC)</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Current status */}
        <div className={`flex items-start gap-4 p-5 rounded-xl border ${levelConf.bgColor}`}>
          <div className={levelConf.color}>{levelConf.icon}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-sm font-bold ${levelConf.color}`}>{levelConf.label}</p>
              {kycProfile && (
                <span className={`text-xs font-medium ${statusConf.color}`}>— {statusConf.label}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{levelConf.description}</p>
            <p className="text-xs text-muted-foreground mt-1">{levelConf.limits}</p>
          </div>
        </div>

        {/* KYC levels */}
        <div className="jdv-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Niveaux de vérification</h3>
          </div>
          <div className="divide-y divide-border">
            {Object.entries(LEVEL_CONFIG).map(([lvl, conf]) => (
              <div key={lvl} className={`flex items-center gap-3 px-4 py-3.5 ${level === lvl ? 'bg-muted/10' : ''}`}>
                <div className={conf.color}>{conf.icon}</div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${conf.color}`}>{conf.label}</p>
                  <p className="text-xs text-muted-foreground">{conf.limits}</p>
                </div>
                {level === lvl && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Actuel</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {!kycProfile ? (
          <div className="jdv-card p-6 text-center space-y-4">
            <Shield size={40} className="mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">Commencer la vérification</p>
              <p className="text-xs text-muted-foreground">Initialisez votre dossier KYC pour accéder à toutes les fonctionnalités JDV PAY.</p>
            </div>
            <button onClick={handleInitKyc} disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Initialisation...</> : <><Shield size={14} /> Commencer la vérification</>}
            </button>
          </div>
        ) : level === 'unverified' || level === 'basic' ? (
          <div className="jdv-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Soumettre un document</h3>
            <p className="text-xs text-muted-foreground">
              La vérification d'identité complète sera disponible prochainement. Notre équipe traitera votre demande manuellement.
            </p>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Type de document</label>
              <select className="jdv-input w-full" value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="national_id">Carte nationale d'identité</option>
                <option value="passport">Passeport</option>
                <option value="driving_license">Permis de conduire</option>
                <option value="proof_of_address">Justificatif de domicile</option>
              </select>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
              <Upload size={24} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Téléchargement de documents</p>
              <p className="text-xs text-muted-foreground mt-1">Disponible prochainement</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-xl bg-info/10 border border-info/20">
              <FileText size={14} className="text-info flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Pour accélérer votre vérification, contactez notre support avec vos documents d'identité.
              </p>
            </div>
          </div>
        ) : (
          <div className="jdv-card p-5 text-center space-y-3">
            <CheckCircle2 size={40} className="mx-auto text-success" />
            <p className="text-sm font-semibold text-foreground">Vérification complète</p>
            <p className="text-xs text-muted-foreground">Votre identité est vérifiée. Vous avez accès à toutes les fonctionnalités JDV PAY.</p>
            {kycProfile.verification_date && (
              <p className="text-xs text-muted-foreground">
                Vérifié le: {new Date(kycProfile.verification_date).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}

        <Link href="/pay" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
