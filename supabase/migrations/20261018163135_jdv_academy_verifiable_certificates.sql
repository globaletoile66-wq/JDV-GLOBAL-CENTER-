-- JDV Academy Certification: verifiable course-completion certificates.
-- Issuance is server-controlled and requires every lesson completed and every assessment passed.
-- A 70% assessment threshold is used as the initial default; no existing data is changed.

CREATE TABLE IF NOT EXISTS public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_code text NOT NULL UNIQUE
    DEFAULT ('JDV-ACA-' || pg_catalog.upper(pg_catalog.substr(pg_catalog.replace(gen_random_uuid()::text, '-', ''), 1, 20))),
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE RESTRICT,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_status text NOT NULL DEFAULT 'active'
    CHECK (certificate_status IN ('active', 'revoked')),
  completion_percent numeric NOT NULL DEFAULT 100
    CHECK (completion_percent >= 0 AND completion_percent <= 100),
  average_score_percent numeric
    CHECK (average_score_percent IS NULL OR (average_score_percent >= 0 AND average_score_percent <= 100)),
  UNIQUE (student_user_id, course_id)
);

CREATE INDEX IF NOT EXISTS academy_certificates_student_idx
  ON public.academy_certificates (student_user_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS academy_certificates_course_idx
  ON public.academy_certificates (course_id, issued_at DESC);

ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.academy_certificates FROM anon, authenticated;
GRANT SELECT ON TABLE public.academy_certificates TO authenticated;

DROP POLICY IF EXISTS academy_certificates_select ON public.academy_certificates;
CREATE POLICY academy_certificates_select
  ON public.academy_certificates
  FOR SELECT
  TO authenticated
  USING (
    student_user_id = (select auth.uid())
    OR is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_courses AS c
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE c.id = academy_certificates.course_id
        AND is_org_admin(p.organization_id)
    )
  );

CREATE OR REPLACE FUNCTION public.academy_issue_certificate(p_course_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_lesson_count integer;
  v_completed_lessons integer;
  v_assessment_count integer;
  v_unpassed_assessments integer;
  v_average_score numeric;
  v_certificate public.academy_certificates%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.academy_enrollments AS e
     WHERE e.course_id = p_course_id
       AND e.student_user_id = v_user_id
       AND e.enrollment_status IN ('confirmed', 'completed')
  ) THEN
    RAISE EXCEPTION 'Confirmed enrollment required' USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer,
         count(*) FILTER (WHERE lp.progress_status = 'completed')::integer
    INTO v_lesson_count, v_completed_lessons
    FROM public.academy_lessons AS l
    LEFT JOIN public.academy_lesson_progress AS lp
      ON lp.lesson_id = l.id AND lp.student_user_id = v_user_id
   WHERE l.course_id = p_course_id;

  IF v_lesson_count = 0 THEN
    RETURN pg_catalog.jsonb_build_object('issued', false, 'reason', 'course_has_no_lessons');
  END IF;

  IF v_completed_lessons < v_lesson_count THEN
    RETURN pg_catalog.jsonb_build_object(
      'issued', false, 'reason', 'lessons_incomplete',
      'completed_lessons', v_completed_lessons, 'total_lessons', v_lesson_count
    );
  END IF;

  SELECT count(*)::integer,
         count(*) FILTER (
           WHERE r.id IS NULL OR r.score < (a.max_score * 0.70)
         )::integer,
         avg((r.score / NULLIF(a.max_score, 0)) * 100)
    INTO v_assessment_count, v_unpassed_assessments, v_average_score
    FROM public.academy_assessments AS a
    LEFT JOIN public.academy_results AS r
      ON r.assessment_id = a.id AND r.student_user_id = v_user_id
   WHERE a.course_id = p_course_id;

  IF v_assessment_count > 0 AND v_unpassed_assessments > 0 THEN
    RETURN pg_catalog.jsonb_build_object(
      'issued', false, 'reason', 'assessments_not_passed',
      'unpassed_assessments', v_unpassed_assessments, 'total_assessments', v_assessment_count,
      'required_percent', 70
    );
  END IF;

  SELECT * INTO v_certificate
    FROM public.academy_certificates
   WHERE student_user_id = v_user_id AND course_id = p_course_id;

  IF FOUND THEN
    IF v_certificate.certificate_status = 'revoked' THEN
      RETURN pg_catalog.jsonb_build_object('issued', false, 'reason', 'certificate_revoked');
    END IF;
    RETURN pg_catalog.jsonb_build_object(
      'issued', true, 'already_issued', true,
      'certificate_code', v_certificate.certificate_code,
      'issued_at', v_certificate.issued_at
    );
  END IF;

  INSERT INTO public.academy_certificates (
    student_user_id, course_id, average_score_percent
  )
  VALUES (v_user_id, p_course_id, v_average_score)
  RETURNING * INTO v_certificate;

  RETURN pg_catalog.jsonb_build_object(
    'issued', true, 'already_issued', false,
    'certificate_code', v_certificate.certificate_code,
    'issued_at', v_certificate.issued_at
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.academy_verify_certificate(p_certificate_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_certificate record;
BEGIN
  IF p_certificate_code IS NULL OR pg_catalog.length(pg_catalog.btrim(p_certificate_code)) = 0 THEN
    RETURN pg_catalog.jsonb_build_object('verified', false, 'reason', 'invalid_code');
  END IF;

  SELECT cert.certificate_code, cert.certificate_status, cert.issued_at,
         cert.completion_percent, cert.average_score_percent,
         coalesce(
           nullif(pg_catalog.btrim(pr.full_name), ''),
           nullif(pg_catalog.btrim(pg_catalog.concat_ws(' ', pr.first_name, pr.last_name)), ''),
           'Apprenant'
         ) AS learner_name,
         c.title AS course_title
    INTO v_certificate
    FROM public.academy_certificates AS cert
    JOIN public.academy_courses AS c ON c.id = cert.course_id
    LEFT JOIN public.profiles AS pr ON pr.id = cert.student_user_id
   WHERE pg_catalog.upper(cert.certificate_code) = pg_catalog.upper(pg_catalog.btrim(p_certificate_code));

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object('verified', false, 'reason', 'not_found');
  END IF;

  IF v_certificate.certificate_status <> 'active' THEN
    RETURN pg_catalog.jsonb_build_object(
      'verified', false, 'reason', 'revoked',
      'certificate_code', v_certificate.certificate_code
    );
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'verified', true,
    'certificate_code', v_certificate.certificate_code,
    'learner_name', v_certificate.learner_name,
    'course_title', v_certificate.course_title,
    'issued_at', v_certificate.issued_at,
    'completion_percent', v_certificate.completion_percent,
    'average_score_percent', v_certificate.average_score_percent,
    'status', 'active'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.academy_issue_certificate(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.academy_issue_certificate(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.academy_verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.academy_verify_certificate(text) TO anon, authenticated;
