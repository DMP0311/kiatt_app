-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  duration INTEGER,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample services
INSERT INTO services (name, description, price, image_url, category, duration, location)
VALUES
  ('Deep Tissue Massage', 'A therapeutic massage that focuses on realigning deeper layers of muscles. It is used for chronic aches and pain and contracted areas such as a stiff neck and upper back, low back pain, leg muscle tightness, and sore shoulders.', 120.00, 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?q=80&w=2940&auto=format&fit=crop', 'Spa', 60, 'Wellness Center'),
  
  ('Swedish Massage', 'A gentle type of full body massage that''s ideal for people who are new to massage, have a lot of tension, or are sensitive to touch. It can help release muscle knots, and it''s also a good choice for when you want to fully relax.', 90.00, 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=2944&auto=format&fit=crop', 'Spa', 45, 'Wellness Center'),
  
  ('Aromatherapy Facial', 'A luxurious facial treatment that combines the power of essential oils with a deep cleansing facial. This treatment will leave your skin refreshed, renewed and glowing.', 85.00, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=2940&auto=format&fit=crop', 'Beauty', 50, 'Spa Suite'),
  
  ('Private Yoga Session', 'One-on-one yoga instruction tailored to your specific needs and goals. Perfect for beginners or those looking to deepen their practice with personalized guidance.', 75.00, 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?q=80&w=2940&auto=format&fit=crop', 'Fitness', 60, 'Yoga Studio'),
  
  ('Personal Training', 'Work with a certified personal trainer to create a customized workout plan that helps you reach your fitness goals. Includes fitness assessment and nutritional guidance.', 95.00, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop', 'Fitness', 45, 'Fitness Center'),
  
  ('Guided Meditation', 'A peaceful guided meditation session to help reduce stress, improve focus, and promote overall wellbeing. Suitable for all experience levels.', 60.00, 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=2622&auto=format&fit=crop', 'Wellness', 30, 'Meditation Room'),
  
  ('Gourmet Cooking Class', 'Learn to prepare delicious gourmet meals with our expert chef. This hands-on class includes all ingredients and equipment, plus you get to enjoy your creation afterward.', 150.00, 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2940&auto=format&fit=crop', 'Culinary', 120, 'Restaurant Kitchen'),
  
  ('Wine Tasting Experience', 'Sample a curated selection of fine wines guided by our sommelier. Learn about wine regions, grape varieties, and proper tasting techniques.', 80.00, 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2940&auto=format&fit=crop', 'Culinary', 90, 'Wine Cellar');

-- Create reviews table (for future implementation)
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  is_helpful INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table (for future implementation)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
