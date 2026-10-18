-- Allow signed-in users to evaluate access to a business.
-- The function itself restricts the result to businesses the caller owns
-- or where the caller has an active membership. Do not grant to anon.
GRANT EXECUTE ON FUNCTION public.user_has_business_access(uuid) TO authenticated;
