-- JDV Academy Live: scheduled course sessions with private meeting details.
-- This stores session metadata and external meeting links; it does not provide video hosting.
-- Existing courses, enrollments, lessons, results, and certificates are untouched.

CREATE TABLE IF NOT EXISTS public.academy_live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(btrim(title)) > 0),
  description text,
  session_type text NOT NULL DEFAULT 'online'
    CHECK (session_type IN ('online', 'in_person', 'hybrid')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  meeting_url text,
  location_text text,
  live_status text NOT NULL DEFAULT 'scheduled'
    CHECK (live_status IN ('scheduled', 'live', 'completed', 'cancelled')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at),
  CHECK (meeting_url IS NULL OR meeting_url ~ '^https://')
);

CREATE INDEX IF NOT EXISTS academy_live_sessions_course_start_idx
  ON public.academy_live_sessions (course_id, starts_at);

ALTER TABLE public.academy_live_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.academy_live_sessions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.academy_live_sessions TO authenticated;

DROP POLICY IF EXISTS academy_live_sessions_select ON public.academy_live_sessions;
CREATE POLICY academy_live_sessions_select
  ON public.academy_live_sessions
  FOR SELECT TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_courses AS c
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE c.id = academy_live_sessions.course_id
        AND (
          c.instructor_user_id = (select auth.uid())
          OR is_org_admin(p.organization_id)
          OR EXISTS (
            SELECT 1
            FROM public.academy_enrollments AS e
            WHERE e.course_id = c.id
              AND e.student_user_id = (select auth.uid())
              AND e.enrollment_status IN ('confirmed', 'completed')
          )
        )
    )
  );

DROP POLICY IF EXISTS academy_live_sessions_manage ON public.academy_live_sessions;
CREATE POLICY academy_live_sessions_manage
  ON public.academy_live_sessions
  FOR ALL TO authenticated
  USING (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_courses AS c
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE c.id = academy_live_sessions.course_id
        AND (
          c.instructor_user_id = (select auth.uid())
          OR is_org_admin(p.organization_id)
        )
    )
  )
  WITH CHECK (
    is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.academy_courses AS c
      JOIN public.academy_programs AS p ON p.id = c.program_id
      WHERE c.id = academy_live_sessions.course_id
        AND (
          c.instructor_user_id = (select auth.uid())
          OR is_org_admin(p.organization_id)
        )
    )
  );
