import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ImmoWorkflowReview from './ImmoWorkflowReview';

export default async function ImmoWorkflowAdminPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase?.auth?.getUser();
  if (!user || authError) redirect('/auth/login?redirect=/super-admin/immo-workflows');
  const { data: admin, error } = await supabase?.from('super_admins')?.select('id, admin_status')?.eq('user_id', user.id)?.eq('admin_status', 'active')?.maybeSingle();
  if (!admin || error) redirect('/access-required?reason=super_admin_required');
  return <ImmoWorkflowReview />;
}
