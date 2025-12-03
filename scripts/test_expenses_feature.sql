-- Test script to verify expenses feature works correctly
-- This script will:
-- 1. Insert a test retail product with expenses
-- 2. Verify the product was created correctly
-- 3. Clean up the test data

-- Insert a test retail product with expenses
INSERT INTO public.retail_products (
  name, 
  size, 
  description, 
  cost_price, 
  expenses, 
  retail_price, 
  quantity_in_stock, 
  reorder_level, 
  product_type
) VALUES (
  'Test Product with Expenses',
  'M',
  'This is a test product to verify expenses functionality',
  100.00,  -- cost_price
  20.00,   -- expenses
  150.00,  -- retail_price
  10,      -- quantity_in_stock
  5,       -- reorder_level
  'TEST'   -- product_type
);

-- Verify the product was created with correct total cost
SELECT 
  id,
  name,
  size,
  cost_price,
  expenses,
  (cost_price + expenses) AS total_cost,
  retail_price,
  ((retail_price - (cost_price + expenses)) / retail_price * 100) AS profit_margin_percent
FROM public.retail_products 
WHERE name = 'Test Product with Expenses' AND size = 'M';

-- Clean up test data
DELETE FROM public.retail_products 
WHERE name = 'Test Product with Expenses' AND size = 'M';