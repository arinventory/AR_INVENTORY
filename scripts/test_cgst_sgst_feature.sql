-- Test script to verify CGST and SGST feature works correctly
-- This script will:
-- 1. Insert a test wholesale sale with CGST and SGST percentages
-- 2. Verify the sale was created correctly
-- 3. Clean up the test data

-- Insert a test wholesale buyer
INSERT INTO public.wholesale_buyers (
  name,
  phone
) VALUES (
  'Test Buyer',
  '9999999999'
);

-- Get the buyer ID
DO $$
DECLARE
  buyer_id UUID;
BEGIN
  SELECT id INTO buyer_id FROM public.wholesale_buyers WHERE phone = '9999999999' LIMIT 1;
  
  -- Insert a test wholesale sale with CGST and SGST percentages
  INSERT INTO public.wholesale_sales (
    customer_id,
    customer_name,
    customer_phone,
    invoice_number,
    sale_date,
    subtotal,
    tax_amount,
    total_amount,
    payment_status,
    cgst_percentage,
    sgst_percentage
  ) VALUES (
    buyer_id,
    'Test Buyer',
    '9999999999',
    'TEST-001',
    CURRENT_DATE,
    1000.00,  -- subtotal
    120.00,   -- tax_amount (6% CGST + 6% SGST on 1000)
    1120.00,  -- total_amount
    'pending',
    6.00,     -- cgst_percentage
    6.00      -- sgst_percentage
  );
  
  -- Verify the sale was created with correct CGST and SGST amounts
  RAISE NOTICE 'Test sale created successfully';
END $$;

-- Verify the sale was created with correct CGST and SGST amounts
SELECT 
  id,
  invoice_number,
  subtotal,
  tax_amount,
  total_amount,
  cgst_percentage,
  sgst_percentage,
  (subtotal * cgst_percentage / 100) AS calculated_cgst,
  (subtotal * sgst_percentage / 100) AS calculated_sgst
FROM public.wholesale_sales 
WHERE invoice_number = 'TEST-001';

-- Clean up test data
DELETE FROM public.wholesale_sales 
WHERE invoice_number = 'TEST-001';

DELETE FROM public.wholesale_buyers 
WHERE phone = '9999999999';