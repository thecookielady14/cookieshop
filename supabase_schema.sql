-- Supabase Schema for The Cookie Lady Shop

-- 1. Create the Products Table
CREATE TABLE public.products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  ingredients TEXT,
  allergens TEXT,
  weight_grams INTEGER,
  image_url TEXT,
  is_bestseller BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create the Orders Table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE,
  total_amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'cancelled')),
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create the Order Items Table (Links orders to products)
CREATE TABLE public.order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_at_time DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Set up Row Level Security (RLS) policies
-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Product Policies:
-- Anyone can READ products (so the shop works for customers)
CREATE POLICY "Public profiles are viewable by everyone." 
ON public.products FOR SELECT USING (true);

-- Only authenticated admins can INSERT, UPDATE, DELETE products
CREATE POLICY "Admins can insert products" 
ON public.products FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Admins can update products" 
ON public.products FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete products" 
ON public.products FOR DELETE USING (auth.role() = 'authenticated');

-- Order Policies:
-- Only authenticated admins or system processes can view/edit orders (via secret key or logged in admin dashboard)
CREATE POLICY "Admins can view orders" 
ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can view order items" 
ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
