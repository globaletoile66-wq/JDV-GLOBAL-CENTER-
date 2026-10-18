-- JDV Academy Learn: learner-owned lesson progress.
-- Additive only. Existing course, lesson, enrollment, and result rows are untouched.
-- Progress can only be read/written by the learner whose enrollment is confirmed/completed.

CREATE TABLE IF NOT EXISTS public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_status text NOT NULL DEFAULT 'in_progress'
    CHECK (progress_status IN ('in_progress', 'completed')),
  last_position_seconds integer NOT NULL DEFAULT 0
    CHECK (last_position_seconds >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, student_user_id),
  CHECK (
    (progress_status = 'completed' AND completed_at IS NOT NULL)
    OR (progress_status = 'in_progress' AND completed_at IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS academy_lesson_progress_student_idx
  ON public.academy_lesson_progress (student_user_id, updated_at DESC);

ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.academy_lesson_progress FROM anon;
REVOKE ALL ON TABLE public.academy_lesson_progress FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.academy_lesson_progress TO authenticated;

DROP POLICY IF EXISTS academy_lesson_progress_student_select ON public.academy_lesson_progress;
CREATE POLICY academy_lesson_progress_student_select
  ON public.academy_lesson_progress
  FOR SELECT
  TO authenticated
  USING (
    student_user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons AS l
      JOIN public.academy_enrollments AS e ON e.course_id = l.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  );

DROP POLICY IF EXISTS academy_lesson_progress_student_insert ON public.academy_lesson_progress;
CREATE POLICY academy_lesson_progress_student_insert
  ON public.academy_lesson_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons AS l
      JOIN public.academy_enrollments AS e ON e.course_id = l.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  );

DROP POLICY IF EXISTS academy_lesson_progress_student_update ON public.academy_lesson_progress;
CREATE POLICY academy_lesson_progress_student_update
  ON public.academy_lesson_progress
  FOR UPDATE
  TO authenticated
  USING (
    student_user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons AS l
      JOIN public.academy_enrollments AS e ON e.course_id = l.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  )
  WITH CHECK (
    student_user_id = (select auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academy_lessons AS l
      JOIN public.academy_enrollments AS e ON e.course_id = l.course_id
      WHERE l.id = academy_lesson_progress.lesson_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  );
