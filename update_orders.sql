CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_number INTEGER DEFAULT nextval('order_number_seq');
