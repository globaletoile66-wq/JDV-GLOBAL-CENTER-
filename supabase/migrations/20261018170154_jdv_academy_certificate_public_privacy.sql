-- JDV Academy: public certificate verification must not disclose grades.
-- Keep the verification result to identity, course, issue date, code and active/revoked status.
-- Existing certificate rows and private score metadata remain unchanged.

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
    'status', 'active'
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.academy_verify_certificate(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.academy_verify_certificate(text) TO anon, authenticated;
