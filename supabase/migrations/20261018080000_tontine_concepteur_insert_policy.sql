-- Give the platform concepteur explicit insert access to tontine drafts.
-- Organization admins remain restricted to their own organization and must set created_by to themselves.
-- No existing tontine data or customer access is changed.
DROP POLICY IF EXISTS tontines_insert_admin ON public.tontines;

CREATE POLICY tontines_insert_admin
ON public.tontines
FOR INSERT
TO authenticated
WITH CHECK (
  is_super_admin()
  OR (
    is_org_admin(organization_id)
    AND created_by = (SELECT auth.uid())
  )
);
