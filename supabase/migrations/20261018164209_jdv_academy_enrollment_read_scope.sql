-- JDV Academy: protect other learners' enrollment metadata.
-- Learners can read their own enrollment; instructors/admins can read course rosters.
-- Existing enrollment records and statuses are unchanged.

DROP POLICY IF EXISTS academy_enrollments_select ON public.academy_enrollments;
CREATE POLICY academy_enrollments_select
  ON public.academy_enrollments
  FOR SELECT TO authenticated
  USING (
    student_user_id = (select auth.uid())
    OR is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_courses AS c
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE c.id = academy_enrollments.course_id
        AND (
          c.instructor_user_id = (select auth.uid())
          OR is_org_admin(p.organization_id)
        )
    )
  );
