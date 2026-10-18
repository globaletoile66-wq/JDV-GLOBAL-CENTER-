-- JDV Academy Learn: typed lesson content and external media references.
-- Existing lessons remain text lessons by default; no content or rows are removed.

ALTER TABLE public.academy_lessons
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS resource_links jsonb NOT NULL DEFAULT '[]'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academy_lessons_content_type_check'
      AND conrelid = 'public.academy_lessons'::regclass
  ) THEN
    ALTER TABLE public.academy_lessons
      ADD CONSTRAINT academy_lessons_content_type_check
      CHECK (content_type IN ('text', 'video', 'document', 'external_link'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academy_lessons_media_url_check'
      AND conrelid = 'public.academy_lessons'::regclass
  ) THEN
    ALTER TABLE public.academy_lessons
      ADD CONSTRAINT academy_lessons_media_url_check
      CHECK (media_url IS NULL OR media_url ~ '^https?://');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'academy_lessons_resource_links_array_check'
      AND conrelid = 'public.academy_lessons'::regclass
  ) THEN
    ALTER TABLE public.academy_lessons
      ADD CONSTRAINT academy_lessons_resource_links_array_check
      CHECK (jsonb_typeof(resource_links) = 'array');
  END IF;
END
$$;
