-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper: user is in a community
CREATE OR REPLACE FUNCTION public.is_community_member(comm_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE community_id = comm_id AND user_id = uid
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: user is trip participant (driver or has booking)
CREATE OR REPLACE FUNCTION public.is_trip_participant(t_id UUID, uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trips t
    WHERE t.id = t_id AND t.driver_id = uid
  ) OR EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.trip_id = t_id AND b.passenger_id = uid AND b.status = 'confirmed'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: user is admin in any community
CREATE OR REPLACE FUNCTION public.is_admin(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.community_members
    WHERE user_id = uid AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- users: allow insert for own id (on first login/signup)
CREATE POLICY "users_insert_own" ON public.users FOR INSERT
  WITH CHECK (id = auth.uid());

-- users: read same-community members; update own
CREATE POLICY "users_select_community" ON public.users FOR SELECT
  USING (
    id = auth.uid()
    OR id IN (
      SELECT cm2.user_id FROM public.community_members cm1
      JOIN public.community_members cm2 ON cm1.community_id = cm2.community_id
      WHERE cm1.user_id = auth.uid()
    )
  );
CREATE POLICY "users_update_own" ON public.users FOR UPDATE
  USING (id = auth.uid());

-- communities: members can read their communities (join flow uses get_community_by_invite_code RPC)
CREATE POLICY "communities_select_member" ON public.communities FOR SELECT
  USING (public.is_community_member(id, auth.uid()));
CREATE POLICY "communities_insert" ON public.communities FOR INSERT
  WITH CHECK (true);
CREATE POLICY "communities_update" ON public.communities FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.community_members WHERE community_id = id AND user_id = auth.uid() AND role = 'admin'));

-- community_members: members can read same community; insert for join; update/delete by admin or self
CREATE POLICY "community_members_select" ON public.community_members FOR SELECT
  USING (public.is_community_member(community_id, auth.uid()));
CREATE POLICY "community_members_insert" ON public.community_members FOR INSERT
  WITH CHECK (user_id = auth.uid() OR public.is_community_member(community_id, auth.uid()));
CREATE POLICY "community_members_update" ON public.community_members FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (public.is_community_member(community_id, auth.uid()) AND EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = community_members.community_id AND cm.user_id = auth.uid() AND cm.role = 'admin'))
  );
CREATE POLICY "community_members_delete" ON public.community_members FOR DELETE
  USING (user_id = auth.uid() OR (EXISTS (SELECT 1 FROM public.community_members cm WHERE cm.community_id = community_members.community_id AND cm.user_id = auth.uid() AND cm.role = 'admin')));

-- trips: community members can select/insert; driver can update own
CREATE POLICY "trips_select" ON public.trips FOR SELECT
  USING (public.is_community_member(community_id, auth.uid()));
CREATE POLICY "trips_insert" ON public.trips FOR INSERT
  WITH CHECK (public.is_community_member(community_id, auth.uid()) AND driver_id = auth.uid());
CREATE POLICY "trips_update" ON public.trips FOR UPDATE
  USING (public.is_community_member(community_id, auth.uid()) AND driver_id = auth.uid());

-- bookings: community members read; insert for self; update/cancel by driver or self
CREATE POLICY "bookings_select" ON public.bookings FOR SELECT
  USING (
    (SELECT community_id FROM public.trips WHERE id = trip_id) IN (SELECT community_id FROM public.community_members WHERE user_id = auth.uid())
  );
CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT
  WITH CHECK (passenger_id = auth.uid());
CREATE POLICY "bookings_update" ON public.bookings FOR UPDATE
  USING (
    passenger_id = auth.uid()
    OR (SELECT driver_id FROM public.trips WHERE id = trip_id) = auth.uid()
  );

-- messages: only trip participants can read/insert
CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (public.is_trip_participant(trip_id, auth.uid()));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (public.is_trip_participant(trip_id, auth.uid()));

-- ratings: community members read; trip participants insert
CREATE POLICY "ratings_select" ON public.ratings FOR SELECT
  USING (
    (SELECT community_id FROM public.trips WHERE id = trip_id) IN (SELECT community_id FROM public.community_members WHERE user_id = auth.uid())
  );
CREATE POLICY "ratings_insert" ON public.ratings FOR INSERT
  WITH CHECK (rater_id = auth.uid() AND public.is_trip_participant(trip_id, auth.uid()));

-- analytics_events: anyone authenticated can insert; only admins can select
CREATE POLICY "analytics_events_insert" ON public.analytics_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "analytics_events_select_admin" ON public.analytics_events FOR SELECT
  USING (public.is_admin(auth.uid()));
