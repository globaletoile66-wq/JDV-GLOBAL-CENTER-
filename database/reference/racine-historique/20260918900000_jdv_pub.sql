-- ============================================================
-- JDV PUB — reconstitué depuis le schéma Supabase live
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pub_advertisers (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  legal_name text NOT NULL,
  contact_email text,
  contact_phone text,
  status text DEFAULT 'active' NOT NULL CHECK (status = ANY (ARRAY['pending','active','suspended','closed'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pub_campaigns (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  advertiser_id uuid NOT NULL REFERENCES pub_advertisers(id) ON DELETE CASCADE,
  name text NOT NULL,
  objective text,
  starts_at timestamptz,
  ends_at timestamptz,
  budget_amount numeric DEFAULT 0 NOT NULL CHECK (budget_amount >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  status text DEFAULT 'draft' NOT NULL CHECK (status = ANY (ARRAY['draft','scheduled','active','paused','completed','cancelled'])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pub_creatives (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES pub_campaigns(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL,
  duration_seconds integer CHECK (duration_seconds IS NULL OR duration_seconds > 0),
  click_url text,
  approval_status text DEFAULT 'pending' NOT NULL CHECK (approval_status = ANY (ARRAY['pending','approved','rejected'])),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pub_placements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  name text NOT NULL,
  placement_type text NOT NULL,
  location_code text,
  price_per_day numeric CHECK (price_per_day IS NULL OR price_per_day >= 0),
  currency_id uuid REFERENCES currencies(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pub_campaign_placements (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES pub_campaigns(id) ON DELETE CASCADE,
  placement_id uuid NOT NULL REFERENCES pub_placements(id) ON DELETE RESTRICT,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text DEFAULT 'scheduled' NOT NULL CHECK (status = ANY (ARRAY['scheduled','active','completed','cancelled'])),
  UNIQUE (campaign_id, placement_id, starts_at)
);

CREATE TABLE IF NOT EXISTS public.pub_impressions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES pub_campaigns(id) ON DELETE CASCADE,
  creative_id uuid REFERENCES pub_creatives(id) ON DELETE SET NULL,
  placement_id uuid REFERENCES pub_placements(id) ON DELETE SET NULL,
  occurred_at timestamptz DEFAULT now() NOT NULL,
  viewer_hash text,
  click_count integer DEFAULT 0 NOT NULL CHECK (click_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_pub_campaigns_advertiser ON pub_campaigns (advertiser_id);
CREATE INDEX IF NOT EXISTS idx_pub_creatives_campaign ON pub_creatives (campaign_id);
CREATE INDEX IF NOT EXISTS idx_pub_impressions_campaign_date ON pub_impressions (campaign_id, occurred_at);

CREATE TRIGGER trg_jdv_protect_pub_advertiser_system BEFORE UPDATE ON public.pub_advertisers FOR EACH ROW EXECUTE FUNCTION jdv_protect_profile_system_fields();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.pub_advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pub_campaign_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pub_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pub_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pub_impressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pub_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY pub_advertisers_access ON pub_advertisers FOR ALL
USING (is_super_admin() OR user_id = auth.uid() OR is_org_member(organization_id))
WITH CHECK (is_super_admin() OR user_id = auth.uid() OR is_org_admin(organization_id));

CREATE POLICY pub_campaign_placements_access ON pub_campaign_placements FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM pub_campaigns c JOIN pub_advertisers a ON a.id = c.advertiser_id WHERE c.id = pub_campaign_placements.campaign_id AND (a.user_id = auth.uid() OR is_org_member(a.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM pub_campaigns c JOIN pub_advertisers a ON a.id = c.advertiser_id WHERE c.id = pub_campaign_placements.campaign_id AND (a.user_id = auth.uid() OR is_org_admin(a.organization_id))));

CREATE POLICY pub_campaigns_access ON pub_campaigns FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM pub_advertisers a WHERE a.id = pub_campaigns.advertiser_id AND (a.user_id = auth.uid() OR is_org_member(a.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM pub_advertisers a WHERE a.id = pub_campaigns.advertiser_id AND (a.user_id = auth.uid() OR is_org_admin(a.organization_id))));

CREATE POLICY pub_creatives_access ON pub_creatives FOR ALL
USING (is_super_admin() OR EXISTS (SELECT 1 FROM pub_campaigns c JOIN pub_advertisers a ON a.id = c.advertiser_id WHERE c.id = pub_creatives.campaign_id AND (a.user_id = auth.uid() OR is_org_member(a.organization_id))))
WITH CHECK (is_super_admin() OR EXISTS (SELECT 1 FROM pub_campaigns c JOIN pub_advertisers a ON a.id = c.advertiser_id WHERE c.id = pub_creatives.campaign_id AND (a.user_id = auth.uid() OR is_org_admin(a.organization_id))));

CREATE POLICY pub_impressions_access ON pub_impressions FOR SELECT
USING (is_super_admin() OR EXISTS (SELECT 1 FROM pub_campaigns c JOIN pub_advertisers a ON a.id = c.advertiser_id WHERE c.id = pub_impressions.campaign_id AND (a.user_id = auth.uid() OR is_org_member(a.organization_id))));

CREATE POLICY pub_placements_access ON pub_placements FOR ALL
USING (is_super_admin() OR is_active = true)
WITH CHECK (is_super_admin());
