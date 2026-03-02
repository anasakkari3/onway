-- book_seat: atomic booking with FOR UPDATE to prevent overselling
CREATE OR REPLACE FUNCTION public.book_seat(
  p_trip_id UUID,
  p_passenger_id UUID,
  p_seats INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trip RECORD;
  v_booking_id UUID;
BEGIN
  IF p_passenger_id IS DISTINCT FROM auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT id, community_id, driver_id, seats_available
  INTO v_trip
  FROM public.trips
  WHERE id = p_trip_id AND status = 'scheduled'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'trip_not_found');
  END IF;

  IF NOT public.is_community_member(v_trip.community_id, auth.uid()) THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_community_member');
  END IF;

  IF v_trip.driver_id = p_passenger_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'driver_cannot_book');
  END IF;

  IF v_trip.seats_available < p_seats THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_enough_seats', 'seats_available', v_trip.seats_available);
  END IF;

  INSERT INTO public.bookings (trip_id, passenger_id, seats, status)
  VALUES (p_trip_id, p_passenger_id, p_seats, 'confirmed')
  RETURNING id INTO v_booking_id;

  UPDATE public.trips
  SET seats_available = seats_available - p_seats
  WHERE id = p_trip_id;

  RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id);
END;
$$;

-- search_trips: geo + time window + ranking (distance, time diff, driver rating)
-- Uses PostGIS ST_DWithin; radius in meters (e.g. 10000 = 10km)
CREATE OR REPLACE FUNCTION public.search_trips(
  p_community_id UUID,
  p_origin_lat DOUBLE PRECISION,
  p_origin_lng DOUBLE PRECISION,
  p_dest_lat DOUBLE PRECISION,
  p_dest_lng DOUBLE PRECISION,
  p_time_start TIMESTAMPTZ,
  p_time_end TIMESTAMPTZ,
  p_radius_m DOUBLE PRECISION DEFAULT 10000
)
RETURNS TABLE (
  id UUID,
  community_id UUID,
  driver_id UUID,
  origin_name TEXT,
  destination_name TEXT,
  departure_time TIMESTAMPTZ,
  seats_available INTEGER,
  price_cents INTEGER,
  driver_rating_avg NUMERIC,
  origin_dist_m DOUBLE PRECISION,
  dest_dist_m DOUBLE PRECISION,
  time_diff_mins DOUBLE PRECISION,
  score DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_community_member(p_community_id, auth.uid()) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH params AS (
    SELECT
      ST_SetSRID(ST_MakePoint(p_origin_lng, p_origin_lat), 4326)::geography AS orig_geom,
      ST_SetSRID(ST_MakePoint(p_dest_lng, p_dest_lat), 4326)::geography AS dest_geom
  ),
  candidates AS (
    SELECT
      t.id,
      t.community_id,
      t.driver_id,
      t.origin_name,
      t.destination_name,
      t.departure_time,
      t.seats_available,
      t.price_cents,
      COALESCE(u.rating_avg, 0)::NUMERIC AS driver_rating_avg,
      ST_Distance(t.origin_geom, p.orig_geom) AS origin_dist_m,
      ST_Distance(t.destination_geom, p.dest_geom) AS dest_dist_m,
      EXTRACT(EPOCH FROM (t.departure_time - p_time_start)) / 60.0 AS time_diff_mins
    FROM public.trips t
    CROSS JOIN params p
    LEFT JOIN public.users u ON u.id = t.driver_id
    WHERE t.community_id = p_community_id
      AND t.status = 'scheduled'
      AND t.departure_time BETWEEN p_time_start AND p_time_end
      AND t.seats_available > 0
      AND ST_DWithin(t.origin_geom, p.orig_geom, p_radius_m)
      AND ST_DWithin(t.destination_geom, p.dest_geom, p_radius_m)
  )
  SELECT
    c.id,
    c.community_id,
    c.driver_id,
    c.origin_name,
    c.destination_name,
    c.departure_time,
    c.seats_available,
    c.price_cents,
    c.driver_rating_avg,
    c.origin_dist_m,
    c.dest_dist_m,
    c.time_diff_mins,
    -- composite score: lower is better (normalize and weight)
    (c.origin_dist_m / 1000.0) * 0.4
    + (c.dest_dist_m / 1000.0) * 0.4
    + (ABS(c.time_diff_mins) / 20.0) * 0.2
    - (c.driver_rating_avg / 5.0) * 0.2 AS score
  FROM candidates c
  ORDER BY score ASC
  LIMIT 50;
END;
$$;

-- Trigger: on ratings insert, update users.rating_avg and rating_count for rated_id
CREATE OR REPLACE FUNCTION public.update_user_rating_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.users u
  SET
    rating_count = (
      SELECT COUNT(*) FROM public.ratings WHERE rated_id = NEW.rated_id
    ),
    rating_avg = (
      SELECT COALESCE(AVG(score), 0) FROM public.ratings WHERE rated_id = NEW.rated_id
    ),
    updated_at = now()
  WHERE u.id = NEW.rated_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ratings_update_user_rating
  AFTER INSERT ON public.ratings
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_user_rating_on_insert();

-- get_community_by_invite_code: for join flow; returns id and name if code valid
CREATE OR REPLACE FUNCTION public.get_community_by_invite_code(p_invite_code TEXT)
RETURNS TABLE (id UUID, name TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name
  FROM public.communities c
  WHERE c.invite_code = p_invite_code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.book_seat(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_trips(UUID, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMPTZ, TIMESTAMPTZ, DOUBLE PRECISION) TO authenticated;
-- cancel_booking: release seats and set booking to cancelled
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  SELECT id, trip_id, passenger_id, seats
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id AND status = 'confirmed'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'booking_not_found');
  END IF;

  IF v_booking.passenger_id <> auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthorized');
  END IF;

  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE public.trips SET seats_available = seats_available + v_booking.seats WHERE id = v_booking.trip_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_community_by_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
