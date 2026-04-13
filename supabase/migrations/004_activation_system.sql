-- Early Network Activation System
-- Adds route demand, route alerts, trust metadata, safety records, and structured notifications.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS communities_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS driver_trips_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS rider_trips_count INTEGER DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0 NOT NULL CHECK (profile_completion >= 0 AND profile_completion <= 100),
  ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 0 NOT NULL CHECK (trust_score >= 0 AND trust_score <= 100),
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
    "booking_emails": true,
    "cancellation_emails": true,
    "chat_emails": true,
    "route_alert_emails": true,
    "system_emails": true,
    "marketing_emails": false
  }'::jsonb NOT NULL;

CREATE TABLE IF NOT EXISTS public.route_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  origin_geom geography(Point, 4326),
  destination_geom geography(Point, 4326),
  normalized_origin TEXT NOT NULL,
  normalized_destination TEXT NOT NULL,
  request_count INTEGER DEFAULT 1 NOT NULL CHECK (request_count > 0),
  active BOOLEAN DEFAULT true NOT NULL,
  fulfilled_by_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  fulfilled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_route_requests_unique_user_route
  ON public.route_requests(community_id, user_id, normalized_origin, normalized_destination);
CREATE INDEX IF NOT EXISTS idx_route_requests_community_active_created
  ON public.route_requests(community_id, active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_requests_origin_geom
  ON public.route_requests USING GIST(origin_geom);
CREATE INDEX IF NOT EXISTS idx_route_requests_destination_geom
  ON public.route_requests USING GIST(destination_geom);

CREATE TABLE IF NOT EXISTS public.route_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_name TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  origin_lat DOUBLE PRECISION,
  origin_lng DOUBLE PRECISION,
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,
  origin_geom geography(Point, 4326),
  destination_geom geography(Point, 4326),
  normalized_origin TEXT NOT NULL,
  normalized_destination TEXT NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  last_notified_at TIMESTAMPTZ,
  last_matched_trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (community_id, user_id, normalized_origin, normalized_destination)
);

CREATE INDEX IF NOT EXISTS idx_route_alerts_community_active
  ON public.route_alerts(community_id, active);
CREATE INDEX IF NOT EXISTS idx_route_alerts_user_active
  ON public.route_alerts(user_id, active);
CREATE INDEX IF NOT EXISTS idx_route_alerts_origin_geom
  ON public.route_alerts USING GIST(origin_geom);
CREATE INDEX IF NOT EXISTS idx_route_alerts_destination_geom
  ON public.route_alerts USING GIST(destination_geom);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking', 'cancellation', 'message', 'route_alert', 'system', 'marketing')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  link_url TEXT,
  dedupe_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked
  ON public.user_blocks(blocked_id);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  context TEXT,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'resolved')),
  review_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_community_status_created
  ON public.reports(community_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.is_community_admin(comm_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = comm_id AND user_id = uid AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.set_activation_geoms()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.origin_lat IS NOT NULL AND NEW.origin_lng IS NOT NULL THEN
    NEW.origin_geom := ST_SetSRID(ST_MakePoint(NEW.origin_lng, NEW.origin_lat), 4326)::geography;
  END IF;
  IF NEW.destination_lat IS NOT NULL AND NEW.destination_lng IS NOT NULL THEN
    NEW.destination_geom := ST_SetSRID(ST_MakePoint(NEW.destination_lng, NEW.destination_lat), 4326)::geography;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS route_requests_set_geoms ON public.route_requests;
CREATE TRIGGER route_requests_set_geoms
  BEFORE INSERT OR UPDATE OF origin_lat, origin_lng, destination_lat, destination_lng
  ON public.route_requests
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_activation_geoms();

DROP TRIGGER IF EXISTS route_alerts_set_geoms ON public.route_alerts;
CREATE TRIGGER route_alerts_set_geoms
  BEFORE INSERT OR UPDATE OF origin_lat, origin_lng, destination_lat, destination_lng
  ON public.route_alerts
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_activation_geoms();

ALTER TABLE public.route_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "route_requests_select_member" ON public.route_requests FOR SELECT
  USING (public.is_community_member(community_id, auth.uid()));
CREATE POLICY "route_requests_insert_own" ON public.route_requests FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_community_member(community_id, auth.uid()));
CREATE POLICY "route_requests_update_own_or_admin" ON public.route_requests FOR UPDATE
  USING (user_id = auth.uid() OR public.is_community_admin(community_id, auth.uid()));

CREATE POLICY "route_alerts_select_own" ON public.route_alerts FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "route_alerts_insert_own" ON public.route_alerts FOR INSERT
  WITH CHECK (user_id = auth.uid() AND public.is_community_member(community_id, auth.uid()));
CREATE POLICY "route_alerts_update_own" ON public.route_alerts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "user_blocks_select_own" ON public.user_blocks FOR SELECT
  USING (blocker_id = auth.uid() OR blocked_id = auth.uid());
CREATE POLICY "user_blocks_insert_own" ON public.user_blocks FOR INSERT
  WITH CHECK (blocker_id = auth.uid());
CREATE POLICY "user_blocks_delete_own" ON public.user_blocks FOR DELETE
  USING (blocker_id = auth.uid());

CREATE POLICY "reports_insert_participant" ON public.reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() AND public.is_trip_participant(trip_id, auth.uid()));
CREATE POLICY "reports_select_admin" ON public.reports FOR SELECT
  USING (community_id IS NOT NULL AND public.is_community_admin(community_id, auth.uid()));
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE
  USING (community_id IS NOT NULL AND public.is_community_admin(community_id, auth.uid()));

ALTER PUBLICATION supabase_realtime ADD TABLE public.route_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.route_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
