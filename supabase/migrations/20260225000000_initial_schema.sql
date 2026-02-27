-- Create Products table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ingredients TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: We will handle auth later via Supabase Auth for the admin panel.
-- Customers and Orders will be handled via Stripe Webhooks.

-- Create Orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT UNIQUE NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  amount_total DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB,
  items JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for public reading of products
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.products FOR SELECT 
USING ( true );

-- Rest of permissions (Insert, Update, Delete) will be locked down 
-- to authenticated admins only.

-- Insert some dummy data for development
INSERT INTO public.products (name, description, ingredients, price, image_url, stock, is_active)
VALUES 
  ('Classic Chocolate Chip', 'Der Klassiker mit zarter Schokolade.', 'Mehl, Butter, Zucker, Brauner Zucker, Eier, Vanille, Schokolade, Natron, Salz', 3.50, '/cookies/classic.jpg', 100, true),
  ('Double Choc Fudge', 'Für alle Schokoholics.', 'Mehl, Kakao, Butter, Zucker, Eier, Vanille, Schokolade, Natron, Salz', 3.90, '/cookies/double.jpg', 100, true),
  ('Peanut Butter Crunch', 'Salzig trifft süß.', 'Mehl, Erdnusbutter, Butter, Zucker, Eier, Vanille, Erdnüsse, Natron, Salz', 3.90, '/cookies/peanut.jpg', 100, true);
