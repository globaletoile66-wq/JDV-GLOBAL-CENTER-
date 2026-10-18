-- JDV Academy Certification: server-side grading for objective-only assessments.
-- Essay and short-answer assessments remain pending for human review.
-- Students can grade only their own submitted copy; answer keys never leave the database.

CREATE OR REPLACE FUNCTION public.academy_grade_submission(p_submission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_submission public.academy_assessment_submissions%ROWTYPE;
  v_course_id uuid;
  v_max_score numeric;
  v_question_count integer;
  v_subjective_count integer;
  v_key_count integer;
  v_total_points numeric;
  v_earned_points numeric;
  v_score numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  SELECT s.*
    INTO v_submission
    FROM public.academy_assessment_submissions AS s
   WHERE s.id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_submission.student_user_id <> v_user_id THEN
    RAISE EXCEPTION 'You may grade only your own submission' USING ERRCODE = '42501';
  END IF;

  IF v_submission.submission_status = 'graded' THEN
    SELECT r.score, a.max_score
      INTO v_score, v_max_score
      FROM public.academy_results AS r
      JOIN public.academy_assessments AS a ON a.id = r.assessment_id
     WHERE r.assessment_id = v_submission.assessment_id
       AND r.student_user_id = v_user_id;
    IF FOUND THEN
      RETURN pg_catalog.jsonb_build_object(
        'graded', true, 'score', v_score, 'max_score', v_max_score, 'already_graded', true
      );
    END IF;
    RETURN pg_catalog.jsonb_build_object('graded', false, 'reason', 'manual_review_required');
  END IF;

  SELECT a.course_id, a.max_score
    INTO v_course_id, v_max_score
    FROM public.academy_assessments AS a
   WHERE a.id = v_submission.assessment_id;

  IF NOT EXISTS (
    SELECT 1
      FROM public.academy_enrollments AS e
     WHERE e.course_id = v_course_id
       AND e.student_user_id = v_user_id
       AND e.enrollment_status IN ('confirmed', 'completed')
  ) THEN
    RAISE EXCEPTION 'Confirmed enrollment required' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer,
         count(*) FILTER (WHERE q.question_type IN ('short_answer', 'essay'))::integer,
         coalesce(sum(q.points), 0)
    INTO v_question_count, v_subjective_count, v_total_points
    FROM public.academy_assessment_questions AS q
   WHERE q.assessment_id = v_submission.assessment_id;

  IF v_question_count = 0 OR v_total_points <= 0 THEN
    RETURN pg_catalog.jsonb_build_object('graded', false, 'reason', 'no_questions');
  END IF;

  IF v_subjective_count > 0 THEN
    RETURN pg_catalog.jsonb_build_object('graded', false, 'reason', 'manual_review_required');
  END IF;

  SELECT count(*)::integer
    INTO v_key_count
    FROM public.academy_assessment_questions AS q
    JOIN public.academy_assessment_answer_keys AS k ON k.question_id = q.id
   WHERE q.assessment_id = v_submission.assessment_id;

  IF v_key_count <> v_question_count THEN
    RETURN pg_catalog.jsonb_build_object('graded', false, 'reason', 'answer_key_incomplete');
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.academy_assessment_questions AS q
     WHERE q.assessment_id = v_submission.assessment_id
       AND NOT (v_submission.answers ? q.id::text)
  ) THEN
    RETURN pg_catalog.jsonb_build_object('graded', false, 'reason', 'answers_incomplete');
  END IF;

  SELECT coalesce(sum(q.points) FILTER (
           WHERE pg_catalog.lower(pg_catalog.btrim(v_submission.answers ->> q.id::text))
               = pg_catalog.lower(pg_catalog.btrim(k.correct_answer #>> '{}'))
         ), 0),
         coalesce(sum(q.points), 0)
    INTO v_earned_points, v_total_points
    FROM public.academy_assessment_questions AS q
    JOIN public.academy_assessment_answer_keys AS k ON k.question_id = q.id
   WHERE q.assessment_id = v_submission.assessment_id;

  v_score := pg_catalog.round((v_earned_points / v_total_points) * v_max_score, 2);

  INSERT INTO public.academy_results (
    assessment_id, student_user_id, score, graded_by, graded_at
  )
  VALUES (
    v_submission.assessment_id, v_user_id, v_score, NULL, pg_catalog.now()
  )
  ON CONFLICT (assessment_id, student_user_id)
  DO UPDATE SET score = EXCLUDED.score, graded_by = NULL, graded_at = EXCLUDED.graded_at;

  UPDATE public.academy_assessment_submissions
     SET submission_status = 'graded'
   WHERE id = v_submission.id;

  RETURN pg_catalog.jsonb_build_object(
    'graded', true, 'score', v_score, 'max_score', v_max_score, 'already_graded', false
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.academy_grade_submission(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.academy_grade_submission(uuid) TO authenticated;
