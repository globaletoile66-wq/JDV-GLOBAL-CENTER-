-- JDV Academy hardening: atomic question/correct-answer creation, enrollment completion integrity,
-- and indexes for foreign-key access paths. This migration is committed to the Academy fix branch;
-- it is not applied to the production database by this change.

create or replace function public.academy_create_assessment_question(
  p_assessment_id uuid,
  p_question_order integer,
  p_question_type text,
  p_prompt text,
  p_options jsonb default '[]'::jsonb,
  p_points numeric default 1,
  p_correct_answer jsonb default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_question_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  if p_assessment_id is null
     or p_question_order < 1
     or p_question_type not in ('single_choice', 'true_false', 'short_answer', 'essay')
     or nullif(btrim(p_prompt), '') is null
     or p_points is null
     or p_points <= 0 then
    raise exception 'Invalid assessment question' using errcode = '22023';
  end if;

  if p_question_type in ('single_choice', 'true_false') and p_correct_answer is null then
    raise exception 'Objective questions require a correct answer' using errcode = '22023';
  end if;

  insert into public.academy_assessment_questions (
    assessment_id, question_order, question_type, prompt, options, points
  )
  values (
    p_assessment_id,
    p_question_order,
    p_question_type,
    btrim(p_prompt),
    coalesce(p_options, '[]'::jsonb),
    p_points
  )
  returning id into v_question_id;

  if p_question_type in ('single_choice', 'true_false') then
    insert into public.academy_assessment_answer_keys (question_id, correct_answer)
    values (v_question_id, p_correct_answer);
  end if;

  return v_question_id;
end;
$$;

revoke all on function public.academy_create_assessment_question(uuid, integer, text, text, jsonb, numeric, jsonb) from public, anon;
grant execute on function public.academy_create_assessment_question(uuid, integer, text, text, jsonb, numeric, jsonb) to authenticated;

create or replace function public.academy_sync_enrollment_completion()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.enrollment_status = 'completed' then
    new.completed_at := coalesce(new.completed_at, now());
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;

drop trigger if exists academy_enrollment_completion_sync on public.academy_enrollments;
create trigger academy_enrollment_completion_sync
before insert or update of enrollment_status, completed_at
on public.academy_enrollments
for each row execute function public.academy_sync_enrollment_completion();

create index if not exists idx_academy_assessment_questions_created_by
  on public.academy_assessment_questions (created_by);
create index if not exists idx_academy_assessments_course
  on public.academy_assessments (course_id);
create index if not exists idx_academy_courses_instructor
  on public.academy_courses (instructor_user_id);
create index if not exists idx_academy_live_sessions_created_by
  on public.academy_live_sessions (created_by);
create index if not exists idx_academy_programs_currency
  on public.academy_programs (currency_id);
create index if not exists idx_academy_programs_organization
  on public.academy_programs (organization_id);
create index if not exists idx_academy_results_graded_by
  on public.academy_results (graded_by);
create index if not exists idx_academy_results_student
  on public.academy_results (student_user_id);
