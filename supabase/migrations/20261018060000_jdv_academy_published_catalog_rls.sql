-- JDV ACADEMY — expose only published programmes and open courses in the public catalogue.
-- This migration is additive: it does not alter or delete existing records.
-- The existing organization policies remain in force; permissive policies are combined with OR.

GRANT SELECT ON TABLE public.academy_programs TO anon, authenticated;
GRANT SELECT ON TABLE public.academy_courses TO anon, authenticated;

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
