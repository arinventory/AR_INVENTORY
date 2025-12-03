-- Test script to verify new buyer creation functionality
-- This script will help verify that the system properly handles new buyers

-- First, let's check if there are any existing buyers with a specific test phone number
SELECT * FROM wholesale_buyers WHERE phone = '9999999999';

-- If the above query returns no results, we can test the creation process
-- by creating a wholesale sale with this phone number and a new buyer name

-- After creating a sale with a new buyer, check that:
-- 1. A new buyer record was created in wholesale_buyers
-- 2. The sale was created correctly in wholesale_sales
-- 3. The customer_id in wholesale_sales links to the new buyer

-- To verify the buyer was created:
SELECT * FROM wholesale_buyers WHERE phone = '9999999999' ORDER BY created_at DESC LIMIT 1;

-- To verify the sale was linked correctly:
SELECT 
    ws.id,
    ws.invoice_number,
    ws.customer_id,
    wb.name as buyer_name,
    wb.phone as buyer_phone
FROM wholesale_sales ws
JOIN wholesale_buyers wb ON ws.customer_id = wb.id
WHERE wb.phone = '9999999999'
ORDER BY ws.created_at DESC
LIMIT 1;

-- Clean up test data (uncomment if needed):
-- DELETE FROM buyer_credit_ledger WHERE reference_id IN (
--     SELECT id FROM wholesale_sales WHERE customer_id IN (
--         SELECT id FROM wholesale_buyers WHERE phone = '9999999999'
--     )
-- );
-- DELETE FROM wholesale_sales_items WHERE sale_id IN (
--     SELECT id FROM wholesale_sales WHERE customer_id IN (
--         SELECT id FROM wholesale_buyers WHERE phone = '9999999999'
--     )
-- );
-- DELETE FROM wholesale_sales WHERE customer_id IN (
--     SELECT id FROM wholesale_buyers WHERE phone = '9999999999'
-- );
-- DELETE FROM wholesale_buyers WHERE phone = '9999999999';