'use client';

import React, { useState } from 'react';
import { Bell, ShieldCheck, CreditCard, Building2, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const notifications = [
  {
    id: 'notif-001',
    type: 'security',
    icon: ShieldCheck,
    title: 'Connexion depuis un nouvel appareil',
    message: 'Cotonou, Bénin — Chrome / Android',
    time: 'Il y a 2h',
    read: false,
    color: '#EF4444',
    urgent: true,
  },
  {
    id: 'notif-002',
    type: 'transaction',
    icon: CreditCard,
    title: 'Virement reçu via JDV PAY',
    message: '15 000 XOF de Amina Diallo',
    time: 'Il y a 4h',
    read: false,
    color: '#10B981',
    urgent: false,
  },
  {
    id: 'notif-003',
    type: 'organization',
    icon: Building2,
    title: 'Invitation organisation',
    message: 'TechBénin SARL vous invite en tant que membre',
    time: 'Il y a 1j',
    read: false,
    color: '#3B82F6',
    urgent: false,
  },
  {
    id: 'notif-004',
    type: 'info',
    icon: Info,
    title: 'JDV ACADEMY bientôt disponible',
    message: 'Inscrivez-vous pour être notifié au lancement',
    time: 'Il y a 2j',
    read: true,
    color: '#8B5CF6',
    urgent: false,
  },
  {
    id: 'notif-005',
    type: 'success',
    icon: CheckCircle2,
    title: 'Profil vérifié avec succès',
    message: 'Votre identité a été confirmée',
    time: 'Il y a 3j',
    read: true,
    color: '#10B981',
    urgent: false,
  },
];

export default function NotificationsPanel() {
  const [items, setItems] = useState(notifications);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('Toutes les notifications marquées comme lues');
  };

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="jdv-card !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-accent" />
          <h2 className="text-sm font-bold text-foreground">Notifications</h2>
          {unreadCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-accent hover:text-accent-light font-semibold transition-colors"
          >
            Tout lire
          </button>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-border">
        {items.map((notif) => (
          <div
            key={notif.id}
            onClick={() => markRead(notif.id)}
            className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors duration-150 hover:bg-muted/20 ${
              !notif.read ? 'bg-muted/10' : ''
            }`}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: `${notif.color}15`, border: `1px solid ${notif.color}25` }}
            >
              <notif.icon size={14} style={{ color: notif.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className={`text-xs font-semibold leading-snug ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {notif.title}
                  {notif.urgent && (
                    <AlertTriangle size={11} className="text-danger inline ml-1 -mt-0.5" />
                  )}
                </p>
                {!notif.read && (
                  <span className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug truncate">{notif.message}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border">
        <button className="text-xs text-accent hover:text-accent-light font-semibold transition-colors w-full text-center">
          Voir toutes les notifications
        </button>
      </div>
    </div>
  );
}