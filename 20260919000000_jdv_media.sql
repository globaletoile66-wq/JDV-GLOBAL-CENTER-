-- ============================================================
-- JDV MEDIA — reconstitué depuis le schéma Supabase live
-- ============================================================

CREATE TABLE IF NOT EXISTS public.media_categories (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.media_channels (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  name text NOT NULL,
  channel_type text NOT NULL,
  handle text,
  website_url text,
  status text DEFAULT 'active' NOT NULL CHECK (status = ANY (ARRAY['draft','active','inactive'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.media_contents (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  channel_id uuid NOT NULL REFERENCES media_channels(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  content_type text NOT NULL,
  body text,
  media_url text,
  published_at timestamptz,
  status text DEFAULT 'draft' NOT NULL CHECK (status = ANY (ARRAY['draft','scheduled','published','archived'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (channel_id, slug)
);

CREATE TABLE IF NOT EXISTS public.media_content_categories (
  content_id uuid NOT NULL REFERENCES media_contents(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES media_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (content_id, category_id)
);

CREATE TABLE IF NOT EXISTS public.media_content_metrics (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  content_id uuid NOT NULL REFERENCES media_contents(id) ON DELETE CASCADE,
  measured_at timestamptz DEFAULT now() NOT NULL,
  views bigint DEFAULT 0 NOT NULL CHECK (views >= 0),
  likes bigint DEFAULT 0 NOT NULL CHECK (likes >= 0),
  shares bigint DEFAULT 0 NOT NULL CHECK (shares >= 0),
  comments bigint DEFAULT 0 NOT NULL CHECK (comments >= 0)
);

CREATE INDEX IF NOT EXISTS idx_media_contents_channel_status ON media_contents (channel_id, status);
CREATE INDEX IF NOT EXISTS idx_media_metrics_content_date ON media_content_metrics (content_id, measured_at);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.media_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY media_categories_access ON media_categories FOR ALL USING (is_super_admin()) WITH CHECK (is_super_admin());

CREATE POLICY media_channels_access ON media_channels FOR ALL
USING (is_super_admin() OR is_org_member(organization_id))
WITH CHECK (is_super_admin() OR is_org_admin(organization_id));

CREATE POLICY media_content_categories_access ON media_content_categories FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM media_contents m JOIN media_channels c ON c.id = m.channel_id WHERE m.id = media_content_categories.content_id AND (m.author_user_id = auth.uid() OR is_org_member(c.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM media_contents m JOIN media_channels c ON c.id = m.channel_id WHERE m.id = media_content_categories.content_id AND (m.author_user_id = auth.uid() OR is_org_admin(c.organization_id))));

CREATE POLICY media_metrics_access ON media_content_metrics FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM media_contents m JOIN media_channels c ON c.id = m.channel_id WHERE m.id = media_content_metrics.content_id AND is_org_member(c.organization_id)))
WITH CHECK (is_super_admin());

CREATE POLICY media_contents_access ON media_contents FOR ALL
USING (is_super_admin() OR author_user_id = auth.uid() OR EXISTS (SELECT 1 FROM media_channels c WHERE c.id = media_contents.channel_id AND is_org_member(c.organization_id)))
WITH CHECK (is_super_admin() OR author_user_id = auth.uid() OR EXISTS (SELECT 1 FROM media_channels c WHERE c.id = media_contents.channel_id AND is_org_admin(c.organization_id)));
