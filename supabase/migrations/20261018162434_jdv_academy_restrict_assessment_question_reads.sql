-- JDV Academy Certification: do not expose assessment prompts to unrelated signed-in users.
-- Existing assessments, questions, submissions, and answer keys are preserved.
-- Students may read questions only when enrolled in the course; organization admins and
-- the global super admin retain their management access through the existing policies.

DROP POLICY IF EXISTS academy_assessment_questions_select
  ON public.academy_assessment_questions;

CREATE POLICY academy_assessment_questions_select
  ON public.academy_assessment_questions
  FOR SELECT
  TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE a.id = academy_assessment_questions.assessment_id
        AND is_org_admin(p.organization_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_enrollments AS e ON e.course_id = a.course_id
      WHERE a.id = academy_assessment_questions.assessment_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  );
