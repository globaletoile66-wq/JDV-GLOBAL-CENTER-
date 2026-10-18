-- JDV Academy: students must not be able to self-confirm an enrollment.
-- Students can request enrollment as pending and cancel their own pending request.
-- Only organization admins / global super admin can confirm or complete enrollments.
-- No existing enrollment rows are deleted or rewritten.

REVOKE ALL ON TABLE public.academy_enrollments FROM anon, authenticated;
GRANT SELECT ON TABLE public.academy_enrollments TO authenticated;
GRANT INSERT (course_id, student_user_id, enrollment_status)
  ON TABLE public.academy_enrollments TO authenticated;
GRANT UPDATE (enrollment_status) ON TABLE public.academy_enrollments TO authenticated;

DROP POLICY IF EXISTS academy_enrollments_access ON public.academy_enrollments;
DROP POLICY IF EXISTS academy_enrollments_select ON public.academy_enrollments;
DROP POLICY IF EXISTS academy_enrollments_insert ON public.academy_enrollments;
DROP POLICY IF EXISTS academy_enrollments_update_admin ON public.academy_enrollments;
DROP POLICY IF EXISTS academy_enrollments_student_cancel ON public.academy_enrollments;

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
        AND is_org_member(p.organization_id)
    )
  );

CREATE POLICY academy_enrollments_insert
  ON public.academy_enrollments
  FOR INSERT TO authenticated
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_courses AS c
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE c.id = academy_enrollments.course_id
        AND is_org_admin(p.organization_id)
    )
    OR (
      student_user_id = (select auth.uid())
      AND enrollment_status = 'pending'
      AND EXISTS (
        SELECT 1
        FROM public.academy_courses AS c
        JOIN public.academy_programs AS p ON p.id = c.program_id
        WHERE c.id = academy_enrollments.course_id
          AND c.status = 'open'
          AND p.status = 'published'
      )
    )
  );

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
        AND is_org_admin(p.organization_id)
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_courses AS c
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE c.id = academy_enrollments.course_id
        AND is_org_admin(p.organization_id)
    )
  );

CREATE POLICY academy_enrollments_student_cancel
  ON public.academy_enrollments
  FOR UPDATE TO authenticated
  USING (
    student_user_id = (select auth.uid())
    AND enrollment_status = 'pending'
  )
  WITH CHECK (
    student_user_id = (select auth.uid())
    AND enrollment_status = 'cancelled'
  );
