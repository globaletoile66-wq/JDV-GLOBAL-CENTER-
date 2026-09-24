'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, CheckCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

const TYPE_COLORS: Record<string, string> = {
  info: 'text-info bg-info/10 border-info/20',
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  error: 'text-danger bg-danger/10 border-danger/20',
  security: 'text-danger bg-danger/10 border-danger/20',
  system: 'text-muted-foreground bg-muted/20 border-border',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { user } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      setNotifications(data || []);
    } catch {}
    finally { setIsLoading(false); }
  };

  const markAllRead = async () => {
    if (!user) return;
    try {
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', user.id).eq('is_read', false);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success('Toutes les notifications marquées comme lues');
    } catch { toast.error('Erreur'); }
  };

  const markRead = async (id: string) => {
    try {
      await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    } catch {}
  };

  const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />Dashboard
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <AppLogo size={28} />
            <span className="font-semibold text-sm text-foreground">Notifications</span>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-ghost text-xs flex items-center gap-1.5">
              <CheckCheck size={14} />Tout marquer comme lu
            </button>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-extrabold text-foreground">Notifications</h1>
          {unreadCount > 0 && <span className="jdv-badge bg-accent/10 text-accent border-accent/20">{unreadCount} non lues</span>}
        </div>

        <div className="flex gap-2 mb-6">
          {[{ id: 'all', label: 'Toutes' }, { id: 'unread', label: 'Non lues' }].map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id as any)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f.id ? 'bg-accent text-white' : 'bg-card border border-border text-muted-foreground hover:text-foreground'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-accent" /></div>
        ) : filtered.length === 0 ? (
          <div className="jdv-card text-center py-16">
            <Bell size={48} className="text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground mb-2">Aucune notification</h3>
            <p className="text-muted-foreground">
              {filter === 'unread' ? 'Vous avez lu toutes vos notifications.' : 'Commencez à utiliser les services JDV pour recevoir des notifications.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && markRead(n.id)}
                className={`jdv-card p-4 cursor-pointer transition-all ${!n.is_read ? 'border-accent/30 bg-accent/5' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {!n.is_read && <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{n.title}</p>
                      <span className={`jdv-badge text-xs border ${TYPE_COLORS[n.notification_type] || TYPE_COLORS.info}`}>{n.notification_type}</span>
                    </div>
                    {n.message && <p className="text-sm text-muted-foreground">{n.message}</p>}
                    <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
