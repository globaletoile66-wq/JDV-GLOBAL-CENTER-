-- JDV Academy Certification: assessment questions, protected answer keys, and learner submissions.
-- No existing assessments/results are removed. Correct answers are stored separately from student-visible questions.

CREATE TABLE IF NOT EXISTS public.academy_assessment_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE CASCADE,
  question_order integer NOT NULL CHECK (question_order > 0),
  question_type text NOT NULL CHECK (question_type IN ('single_choice', 'true_false', 'short_answer', 'essay')),
  prompt text NOT NULL CHECK (length(btrim(prompt)) > 0),
  options jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(options) = 'array'),
  points numeric NOT NULL DEFAULT 1 CHECK (points > 0),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, question_order)
);

CREATE TABLE IF NOT EXISTS public.academy_assessment_answer_keys (
  question_id uuid PRIMARY KEY REFERENCES public.academy_assessment_questions(id) ON DELETE CASCADE,
  correct_answer jsonb NOT NULL,
  grading_notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_assessment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.academy_assessments(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL DEFAULT 1 CHECK (attempt_number > 0),
  answers jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object'),
  submission_status text NOT NULL DEFAULT 'submitted' CHECK (submission_status IN ('submitted', 'graded')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assessment_id, student_user_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS academy_assessment_questions_assessment_idx
  ON public.academy_assessment_questions (assessment_id, question_order);
CREATE INDEX IF NOT EXISTS academy_assessment_submissions_student_idx
  ON public.academy_assessment_submissions (student_user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS academy_assessment_submissions_assessment_idx
  ON public.academy_assessment_submissions (assessment_id, submitted_at DESC);

ALTER TABLE public.academy_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_assessment_answer_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_assessment_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.academy_assessment_questions FROM anon;
REVOKE ALL ON TABLE public.academy_assessment_answer_keys FROM anon;
REVOKE ALL ON TABLE public.academy_assessment_submissions FROM anon;
REVOKE ALL ON TABLE public.academy_assessment_questions FROM authenticated;
REVOKE ALL ON TABLE public.academy_assessment_answer_keys FROM authenticated;
REVOKE ALL ON TABLE public.academy_assessment_submissions FROM authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.academy_assessment_questions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.academy_assessment_answer_keys TO authenticated;
GRANT SELECT ON TABLE public.academy_assessment_submissions TO authenticated;
GRANT INSERT (assessment_id, student_user_id, attempt_number, answers)
  ON TABLE public.academy_assessment_submissions TO authenticated;
GRANT UPDATE (submission_status) ON TABLE public.academy_assessment_submissions TO authenticated;

DROP POLICY IF EXISTS academy_assessment_questions_select ON public.academy_assessment_questions;
CREATE POLICY academy_assessment_questions_select
  ON public.academy_assessment_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.academy_assessments AS a
      WHERE a.id = academy_assessment_questions.assessment_id
    )
  );

DROP POLICY IF EXISTS academy_assessment_questions_manage ON public.academy_assessment_questions;
CREATE POLICY academy_assessment_questions_manage
  ON public.academy_assessment_questions FOR ALL TO authenticated
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
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE a.id = academy_assessment_questions.assessment_id
        AND is_org_admin(p.organization_id)
    )
  );

DROP POLICY IF EXISTS academy_assessment_answer_keys_manage ON public.academy_assessment_answer_keys;
CREATE POLICY academy_assessment_answer_keys_manage
  ON public.academy_assessment_answer_keys FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessment_questions AS q
      JOIN public.academy_assessments AS a ON a.id = q.assessment_id
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE q.id = academy_assessment_answer_keys.question_id
        AND is_org_admin(p.organization_id)
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessment_questions AS q
      JOIN public.academy_assessments AS a ON a.id = q.assessment_id
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE q.id = academy_assessment_answer_keys.question_id
        AND is_org_admin(p.organization_id)
    )
  );

DROP POLICY IF EXISTS academy_assessment_submissions_select ON public.academy_assessment_submissions;
CREATE POLICY academy_assessment_submissions_select
  ON public.academy_assessment_submissions FOR SELECT TO authenticated
  USING (
    student_user_id = (select auth.uid())
    OR is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE a.id = academy_assessment_submissions.assessment_id
        AND is_org_admin(p.organization_id)
    )
  );

DROP POLICY IF EXISTS academy_assessment_submissions_insert ON public.academy_assessment_submissions;
CREATE POLICY academy_assessment_submissions_insert
  ON public.academy_assessment_submissions FOR INSERT TO authenticated
  WITH CHECK (
    student_user_id = (select auth.uid())
    AND submission_status = 'submitted'
    AND EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_enrollments AS e ON e.course_id = a.course_id
      WHERE a.id = academy_assessment_submissions.assessment_id
        AND e.student_user_id = (select auth.uid())
        AND e.enrollment_status IN ('confirmed', 'completed')
    )
  );

DROP POLICY IF EXISTS academy_assessment_submissions_manage ON public.academy_assessment_submissions;
CREATE POLICY academy_assessment_submissions_manage
  ON public.academy_assessment_submissions FOR UPDATE TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_assessments AS a
      JOIN public.academy_courses AS c ON c.id = a.course_id
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE a.id = academy_assessment_submissions.assessment_id
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
      WHERE a.id = academy_assessment_submissions.assessment_id
        AND is_org_admin(p.organization_id)
    )
  );
