-- JDV Academy Certification: protect result integrity.
-- Students can read their own results but cannot create, alter, or delete scores.
-- Organization admins and the global super admin may manage results for their scope.
-- No existing result rows are modified or deleted.

REVOKE ALL ON TABLE public.academy_results FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.academy_results TO authenticated;

DROP POLICY IF EXISTS academy_results_access ON public.academy_results;
DROP POLICY IF EXISTS academy_results_select ON public.academy_results;
DROP POLICY IF EXISTS academy_results_manage ON public.academy_results;

CREATE POLICY academy_results_select
  ON public.academy_results
  FOR SELECT
  TO authenticated
  USING (
    student_user_id = (select auth.uid())
    OR is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE a.id = academy_results.assessment_id
        AND is_org_admin(p.organization_id)
    )
  );

CREATE POLICY academy_results_manage
  ON public.academy_results
  FOR ALL
  TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE a.id = academy_results.assessment_id
        AND is_org_admin(p.organization_id)
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE a.id = academy_results.assessment_id
        AND is_org_admin(p.organization_id)
    )
  );
