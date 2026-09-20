import { SupabaseClient } from '@supabase/supabase-js';
export async function getCurrentBusinessId(supabase: SupabaseClient,userId:string){
 const {data:owned}=await supabase.from('business_profiles').select('id').eq('owner_user_id',userId).maybeSingle();
 if(owned?.id)return owned.id as string;
 const {data:member}=await supabase.from('business_members').select('business_id').eq('user_id',userId).eq('is_active',true).maybeSingle();
 return (member?.business_id as string)||null;
}