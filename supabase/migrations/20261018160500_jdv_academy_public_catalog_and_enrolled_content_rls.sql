-- JDV Academy: reconcile the public catalogue and enrolled learner read access.
-- Additive and repeatable: only the named policies are replaced; no rows or tables are deleted.
-- Public visitors may see published programmes and open courses attached to published programmes.
-- Lesson content and assessments remain private to confirmed/completed learners and existing
-- organization-authorized roles. Existing organization policies are intentionally preserved.

GRANT SELECT ON TABLE public.academy_programs TO anon, authenticated;
GRANT SELECT ON TABLE public.academy_courses TO anon, authenticated;
GRANT SELECT ON TABLE public.academy_lessons TO authenticated;
GRANT SELECT ON TABLE public.academy_assessments TO authenticated;

DROP POLICY IF EXISTS academy_programs_published_catalog_select ON public.academy_programs;
CREATE POLICY academy_programs_published_catalog_select
  ON public.academy_programs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS academy_courses_published_catalog_select ON public.academy_courses;
CREATE POLICY academy_courses_published_catalog_select
  ON public.academy_courses
  FOR SELECT
  TO anon, authenticated
  USING (
    status = 'open'
    AND EXISTS (
      SELECT 1
      FROM public.academy_programs AS p
      WHERE p.id = academy_courses.program_id
        AND p.status = 'published'
    )
  );

DROP POLICY IF EXISTS academy_lessons_enrolled_student_select ON public.academy_lessons;
CREATE POLICY academy_lessons_enrolled_student_select
  ON public.academy_lessons
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.academy_enrollments AS e
      WHERE e.course_id = academy_lessons.course_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  );

DROP POLICY IF EXISTS academy_assessments_enrolled_student_select ON public.academy_assessments;
CREATE POLICY academy_assessments_enrolled_student_select
  ON public.academy_assessments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.academy_enrollments AS e
      WHERE e.course_id = academy_assessments.course_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  );
