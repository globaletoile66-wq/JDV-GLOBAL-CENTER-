-- JDV ACADEMY — allow enrolled learners to read course content and assessments.
-- Students only receive SELECT access after their enrollment is confirmed or completed.
-- Existing organization-admin write policies remain unchanged.

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
