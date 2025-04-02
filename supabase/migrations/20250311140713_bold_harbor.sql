/*
  # Resort Application Database Schema

  1. New Tables
    - `profiles`
      - Extended user profile information
      - Linked to Supabase auth.users
    - `rooms`
      - Available rooms in the resort
      - Includes type, capacity, pricing
    - `room_bookings`
      - Room reservations
      - Tracks check-in/out dates, guests
    - `services`
      - Resort services (spa, dining, etc.)
      - Service details and pricing
    - `service_bookings`
      - Service reservations
      - Links users to services with time slots
    - `reviews`
      - User reviews for rooms and services
      - Rating and feedback system
    - `notifications`
      - System notifications and alerts
      - Tracks user notification preferences

  2. Security
    - RLS enabled on all tables
    - Policies for user data access
    - Service-specific access controls
*/

-- Profiles table for extended user information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text,
  phone_number text,
  avatar_url text,
  preferences jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number text UNIQUE NOT NULL,
  room_type text NOT NULL,
  description text NOT NULL,
  capacity int NOT NULL,
  price_per_night decimal NOT NULL,
  amenities jsonb DEFAULT '[]',
  images text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available rooms"
  ON rooms
  FOR SELECT
  TO authenticated
  USING (true);

-- Room bookings table
CREATE TABLE IF NOT EXISTS room_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES rooms(id),
  user_id uuid REFERENCES auth.users(id),
  check_in_date date NOT NULL,
  check_out_date date NOT NULL,
  guest_count int NOT NULL,
  total_price decimal NOT NULL,
  status text DEFAULT 'pending',
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (check_out_date > check_in_date)
);

ALTER TABLE room_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bookings"
  ON room_bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
  ON room_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  description text NOT NULL,
  price decimal NOT NULL,
  duration interval,
  images text[] DEFAULT '{}',
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available services"
  ON services
  FOR SELECT
  TO authenticated
  USING (true);

-- Service bookings table
CREATE TABLE IF NOT EXISTS service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES services(id),
  user_id uuid REFERENCES auth.users(id),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  guest_count int DEFAULT 1,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service bookings"
  ON service_bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service bookings"
  ON service_bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  room_id uuid REFERENCES rooms(id),
  service_id uuid REFERENCES services(id),
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  images text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT review_target_check CHECK (
    (room_id IS NOT NULL AND service_id IS NULL) OR
    (service_id IS NOT NULL AND room_id IS NULL)
  )
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all reviews"
  ON reviews
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own reviews"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Functions and Triggers

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DO $$
BEGIN
  CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

  CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

  CREATE TRIGGER update_room_bookings_updated_at
    BEFORE UPDATE ON room_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

  CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

  CREATE TRIGGER update_service_bookings_updated_at
    BEFORE UPDATE ON service_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

  CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
END $$;
