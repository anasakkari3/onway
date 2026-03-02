-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users (profile; id matches auth.users.id)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  display_name TEXT,
  avatar_url TEXT,
  rating_avg NUMERIC(3,2) DEFAULT 0 NOT NULL,
  rating_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Communities
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Community members
CREATE TABLE public.community_members (
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  PRIMARY KEY (community_id, user_id)
);

-- Trips (with PostGIS geography for origin/destination)
CREATE TABLE public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  origin_name TEXT NOT NULL,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  destination_name TEXT NOT NULL,
  origin_geom geography(Point, 4326),
  destination_geom geography(Point, 4326),
  departure_time TIMESTAMPTZ NOT NULL,
  seats_total INTEGER NOT NULL CHECK (seats_total > 0),
  seats_available INTEGER NOT NULL CHECK (seats_available >= 0),
  price_cents INTEGER,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_trips_origin_geom ON public.trips USING GIST(origin_geom);
CREATE INDEX idx_trips_destination_geom ON public.trips USING GIST(destination_geom);
CREATE INDEX idx_trips_community_departure ON public.trips(community_id, departure_time);
CREATE INDEX idx_trips_status ON public.trips(status);

-- Trigger to set origin_geom and destination_geom from lat/lng
CREATE OR REPLACE FUNCTION public.set_trip_geoms()
RETURNS TRIGGER AS $$
BEGIN
  NEW.origin_geom := ST_SetSRID(ST_MakePoint(NEW.origin_lng, NEW.origin_lat), 4326)::geography;
  NEW.destination_geom := ST_SetSRID(ST_MakePoint(NEW.destination_lng, NEW.destination_lat), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trips_set_geoms
  BEFORE INSERT OR UPDATE OF origin_lat, origin_lng, destination_lat, destination_lng
  ON public.trips
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_trip_geoms();

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seats INTEGER NOT NULL CHECK (seats > 0),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (trip_id, passenger_id)
);

CREATE INDEX idx_bookings_trip ON public.bookings(trip_id);
CREATE INDEX idx_bookings_passenger ON public.bookings(passenger_id);

-- Messages (trip-based chat)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_messages_trip ON public.messages(trip_id);

-- Ratings
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (trip_id, rater_id, rated_id)
);

CREATE INDEX idx_ratings_rated ON public.ratings(rated_id);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_analytics_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_created ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_community ON public.analytics_events(community_id);

-- Enable Realtime for messages and trips (seat updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
