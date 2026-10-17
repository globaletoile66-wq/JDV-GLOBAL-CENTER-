import React from 'react';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function WelcomeHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            Bonjour, Kofi 👋
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tableau de bord JDV GLOBAL CENTER — 18 sept. 2026, 17:16
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Account status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-success/10 border border-success/20">
          <CheckCircle2 size={14} className="text-success" />
          <span className="text-xs font-semibold text-success">Compte vérifié</span>
        </div>

        {/* Profile completion warning */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-warning/10 border border-warning/20">
          <AlertTriangle size={14} className="text-warning" />
          <span className="text-xs font-semibold text-warning">Profil à 72%</span>
        </div>

        {/* Last login */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border">
          <Clock size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium">Dernière connexion : 17 sept. 2026</span>
        </div>
      </div>
    </div>
  );
}