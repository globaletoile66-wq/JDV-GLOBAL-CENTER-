-- JDV Academy: assigned instructors may approve/manage enrollment status for their own courses.
-- Student cancellation remains limited to the student's own pending request.
-- No existing enrollment records are changed.

DROP POLICY IF EXISTS academy_enrollments_update_admin ON public.academy_enrollments;
CREATE POLICY academy_enrollments_update_admin
  ON public.academy_enrollments
  FOR UPDATE TO authenticated
  USING (
    is_super_admin()
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
  )
  WITH CHECK (
    is_super_admin()
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
