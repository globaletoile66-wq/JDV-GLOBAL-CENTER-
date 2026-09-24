import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SuperAdminDashboard from './components/SuperAdminDashboard';

export default async function SuperAdminPage() {
  const supabase = await createClient();
  
  // Server-side auth check
  const { data: { user }, error: authError } = await supabase?.auth?.getUser();
  
  if (!user || authError) {
    redirect('/auth/login?redirect=/super-admin');
  }

  // Server-side super admin verification — NOT just frontend check
  const { data: superAdmin, error: saError } = await supabase?.from('super_admins')?.select('id, admin_status')?.eq('user_id', user?.id)?.eq('admin_status', 'active')?.maybeSingle();

  if (!superAdmin || saError) {
    redirect('/access-required?reason=super_admin_required');
  }

  // Load stats server-side
  const results = await Promise.all([
    supabase?.from('profiles')?.select('*', { count: 'exact', head: true }),
    supabase?.from('organizations')?.select('*', { count: 'exact', head: true }),
    supabase?.from('modules')?.select('*', { count: 'exact', head: true }),
    supabase?.from('profiles')?.select('id, email, full_name, account_status, created_at')?.order('created_at', { ascending: false })?.limit(10),
    supabase?.from('organizations')?.select('id, name, org_status, created_at')?.order('created_at', { ascending: false })?.limit(10),
  ]);

  const usersCount = results?.[0]?.count;
  const orgsCount = results?.[1]?.count;
  const modulesCount = results?.[2]?.count;
  const recentUsers = results?.[3]?.data;
  const recentOrgs = results?.[4]?.data;

  const stats = {
    usersCount: usersCount || 0,
    orgsCount: orgsCount || 0,
    modulesCount: modulesCount || 0,
  };

  return (
    <SuperAdminDashboard
      stats={stats}
      recentUsers={recentUsers || []}
      recentOrgs={recentOrgs || []}
      adminUser={user}
    />
  );
}
