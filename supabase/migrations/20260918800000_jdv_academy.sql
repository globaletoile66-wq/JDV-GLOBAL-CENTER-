-- ============================================================
-- JDV ACADEMY — reconstitué depuis le schéma Supabase live
-- ============================================================

CREATE TABLE IF NOT EXISTS public.academy_programs (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  program_type text DEFAULT 'course' NOT NULL,
  duration_hours numeric CHECK (duration_hours IS NULL OR duration_hours >= 0),
  price numeric CHECK (price IS NULL OR price >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status = ANY (ARRAY['draft','published','archived'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.academy_courses (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES academy_programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  instructor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  starts_at timestamptz,
  ends_at timestamptz,
  capacity integer CHECK (capacity IS NULL OR capacity > 0),
  status text DEFAULT 'planned' NOT NULL CHECK (status = ANY (ARRAY['planned','open','running','completed','cancelled'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.academy_lessons (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  lesson_order integer NOT NULL CHECK (lesson_order > 0),
  content text,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (course_id, lesson_order)
);

CREATE TABLE IF NOT EXISTS public.academy_enrollments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_status text DEFAULT 'pending' NOT NULL CHECK (enrollment_status = ANY (ARRAY['pending','confirmed','completed','cancelled'])),
  enrolled_at timestamptz DEFAULT now() NOT NULL,
  completed_at timestamptz,
  UNIQUE (course_id, student_user_id)
);

CREATE TABLE IF NOT EXISTS public.academy_assessments (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  course_id uuid NOT NULL REFERENCES academy_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  max_score numeric DEFAULT 100 NOT NULL CHECK (max_score > 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.academy_results (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  assessment_id uuid NOT NULL REFERENCES academy_assessments(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score numeric NOT NULL CHECK (score >= 0),
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz,
  UNIQUE (assessment_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_academy_courses_program ON academy_courses (program_id);
CREATE INDEX IF NOT EXISTS idx_academy_enrollments_student ON academy_enrollments (student_user_id);
CREATE INDEX IF NOT EXISTS idx_academy_lessons_course ON academy_lessons (course_id, lesson_order);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.academy_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY academy_assessments_access ON academy_assessments FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM academy_courses c JOIN academy_programs p ON p.id = c.program_id WHERE c.id = academy_assessments.course_id AND is_org_member(p.organization_id)))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM academy_courses c JOIN academy_programs p ON p.id = c.program_id WHERE c.id = academy_assessments.course_id AND is_org_admin(p.organization_id)));

CREATE POLICY academy_courses_access ON academy_courses FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM academy_programs p WHERE p.id = academy_courses.program_id AND is_org_member(p.organization_id)))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM academy_programs p WHERE p.id = academy_courses.program_id AND is_org_admin(p.organization_id)));

CREATE POLICY academy_enrollments_access ON academy_enrollments FOR ALL
USING (is_super_admin() OR student_user_id = auth.uid() OR EXISTS (SELECT 1 FROM academy_courses c JOIN academy_programs p ON p.id = c.program_id WHERE c.id = academy_enrollments.course_id AND is_org_member(p.organization_id)))
WITH CHECK (is_super_admin() OR student_user_id = auth.uid() OR EXISTS (SELECT 1 FROM academy_courses c JOIN academy_programs p ON p.id = c.program_id WHERE c.id = academy_enrollments.course_id AND is_org_admin(p.organization_id)));

CREATE POLICY academy_lessons_access ON academy_lessons FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM academy_courses c JOIN academy_programs p ON p.id = c.program_id WHERE c.id = academy_lessons.course_id AND is_org_member(p.organization_id)))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM academy_courses c JOIN academy_programs p ON p.id = c.program_id WHERE c.id = academy_lessons.course_id AND is_org_admin(p.organization_id)));

CREATE POLICY academy_programs_access ON academy_programs FOR ALL
USING (is_super_admin() OR is_org_member(organization_id))
WITH CHECK (is_super_admin() OR is_org_admin(organization_id));

CREATE POLICY academy_results_access ON academy_results FOR ALL
USING (is_super_admin() OR student_user_id = auth.uid() OR graded_by = auth.uid() OR EXISTS (SELECT 1 FROM academy_assessments a JOIN academy_courses c ON c.id = a.course_id JOIN academy_programs p ON p.id = c.program_id WHERE a.id = academy_results.assessment_id AND is_org_member(p.organization_id)))
WITH CHECK (is_super_admin() OR student_user_id = auth.uid() OR graded_by = auth.uid() OR EXISTS (SELECT 1 FROM academy_assessments a JOIN academy_courses c ON c.id = a.course_id JOIN academy_programs p ON p.id = c.program_id WHERE a.id = academy_results.assessment_id AND is_org_admin(p.organization_id)));