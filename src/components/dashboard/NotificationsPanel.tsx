'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ago, type NotificationItem } from '@/lib/dashboard/types';

export default function NotificationsPanel({ unread, items, onChange }: { unread: number; items: NotificationItem[]; onChange: () => void }) {
  const router = useRouter();
  async function open(n: NotificationItem) {
    if (!n.is_read) { await createClient().rpc('dashboard_mark_notifications_read', { p_ids: [n.id] }); onChange(); }
    if (n.action_url && n.action_url.startsWith('/')) router.push(n.action_url);
  }
  async function markAll() { await createClient().rpc('dashboard_mark_notifications_read', { p_ids: null }); onChange(); }
  return (
    <section aria-labelledby="notif-title" className="jdv-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="notif-title" className="font-bold text-foreground">Notifications {unread > 0 && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{unread}</span>}</h2>
        {unread > 0 && <button type="button" onClick={markAll} className="text-xs font-medium text-accent hover:underline">Tout marquer comme lu</button>}
      </div>
      {items.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">Aucune notification.</p> : (
        <ul className="mt-3 space-y-2">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => open(n)} className={`w-full rounded-lg border p-3 text-left transition-colors hover:border-accent/40 ${n.is_read ? 'border-border' : 'border-accent/40 bg-accent/5'}`}>
                <p className="text-sm font-medium text-foreground">{!n.is_read && <span aria-label="non lue" className="mr-1 text-accent">●</span>}{n.title}</p>
                {n.message && <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{ago(n.created_at)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Link href="/notifications" className="mt-3 block text-center text-xs font-medium text-accent hover:underline">Voir toutes les notifications</Link>
    </section>
  );
}
