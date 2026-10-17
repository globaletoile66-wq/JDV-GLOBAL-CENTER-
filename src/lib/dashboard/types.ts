export type Wallet = { id: string; currency: string; symbol: string | null; decimals: number; balance: number; available: number; status: string };
export type SeriesPoint = { day: string; inflow: number; outflow: number };
export type Stats = { currency: string | null; tx_count_30d: number; inflow_30d: number; outflow_30d: number; series: SeriesPoint[] };
export type ActivityItem = { kind: 'transaction' | 'login' | 'audit'; title: string; detail: string | null; at: string; module: string; amount?: number; currency?: string; status?: string; direction?: 'in' | 'out' };
export type NotificationItem = { id: string; title: string; message: string | null; type: string; action_url: string | null; is_read: boolean; created_at: string };
export type SubscriptionItem = { subscription_id: string; subject_type: string; organization_name: string | null; module_code: string; plan_name: string; status: string; expires_at: string | null; days_left: number | null; is_effectively_active: boolean; can_manage: boolean };
export type OrganizationItem = { id: string; name: string; role: string | null; status: string };
export type Branch = { code: string; name: string; icon: string | null; category: string | null; status: string; description: string | null; requires_subscription: boolean; has_access: boolean; is_favorite: boolean; last_used_at: string | null };
export type ChecklistItem = { key: string; label: string; done: boolean; href: string; detail?: string[] };

export type DashboardData = {
  profile: { id: string; full_name: string; first_name: string | null; email: string; avatar_url: string | null; completeness: number; missing: string[]; onboarding_completed: boolean };
  security: { email_verified: boolean; mfa_enabled: boolean; kyc_level: string | null; kyc_status: string | null };
  kpis: { active_branches: number; organizations: number; unread_notifications: number; profile_completeness: number };
  checklist: ChecklistItem[]; wallets: Wallet[]; stats: Stats; activity: ActivityItem[];
  notifications: { unread: number; items: NotificationItem[] };
  subscriptions: SubscriptionItem[]; organizations: OrganizationItem[]; branches: Branch[];
};

export function money(n: number, code: string | null | undefined): string {
  const c = code || 'XOF';
  try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: c === 'XOF' || c === 'XAF' ? 0 : 2 }).format(n); }
  catch { return `${Math.round(n * 100) / 100} ${c}`; }
}

/** « il y a 5 min », « hier », sinon la date. */
export function ago(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.floor(s / 3600)} h`;
  if (s < 172800) return 'hier';
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Description lisible d'un user-agent (sans bibliothèque). */
export function device(ua: string | null | undefined): string {
  if (!ua) return 'Appareil inconnu';
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ua.split(' ')[0];
  const o = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  return o ? `${b} sur ${o}` : b;
}
