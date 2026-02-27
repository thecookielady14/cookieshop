-- Run this in the Supabase SQL Editor to add the availability feature
ALTER TABLE public.products ADD COLUMN is_available BOOLEAN DEFAULT false;

-- Update existing products to be unavailable by default so orders don't come in
UPDATE public.products SET is_available = false;
