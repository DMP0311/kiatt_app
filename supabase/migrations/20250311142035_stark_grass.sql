/*
  # Add reviews functionality

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `room_id` (uuid, foreign key to rooms, nullable)
      - `service_id` (uuid, foreign key to services, nullable)
      - `rating` (integer, 1-5)
      - `comment` (text)
      - `images` (text array)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `reviews` table
    - Add policies for authenticated users to:
      - Create their own reviews
      - Read all reviews
      - Update their own reviews
      - Delete their own reviews

  3. Constraints
    - Rating must be between 1 and 5
    - Either room_id or service_id must be set, but not both
*/

DO $$ BEGIN
  -- Create reviews table if it doesn't exist
  CREATE TABLE IF NOT EXISTS reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    room_id uuid REFERENCES rooms(id),
    service_id uuid REFERENCES services(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    images text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT review_target_check CHECK (
      (room_id IS NOT NULL AND service_id IS NULL) OR
      (service_id IS NOT NULL AND room_id IS NULL)
    )
  );

  -- Enable RLS
  ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can read all reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
  DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

  -- Create policies
  CREATE POLICY "Users can create their own reviews"
    ON reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can read all reviews"
    ON reviews
    FOR SELECT
    TO authenticated
    USING (true);

  CREATE POLICY "Users can update their own reviews"
    ON reviews
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own reviews"
    ON reviews
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

  -- Create trigger for updating updated_at
  DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
  
  CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
END $$;
