-- Debug script to check credit ledger entries for a specific payment
-- Replace 'YOUR_PAYMENT_ID' with the actual payment ID you're trying to delete

-- First, check the payment details
SELECT 'Payment' as record_type, id, supplier_id, amount, payment_date 
FROM public.payments 
WHERE id = 'd0284c17-631d-4cb8-bb23-47b4f233bc32';

-- Then, check what credit ledger entries are associated with this payment
SELECT 'Credit Ledger' as record_type, id, supplier_id, transaction_type, amount, reference_id, reference_type, description, balance_after, created_at
FROM public.credit_ledger 
WHERE reference_id = 'd0284c17-631d-4cb8-bb23-47b4f233bc32';

-- Also check by description pattern
SELECT 'Credit Ledger (by description)' as record_type, id, supplier_id, transaction_type, amount, reference_id, reference_type, description, balance_after, created_at
FROM public.credit_ledger 
WHERE description ILIKE '%d0284c17-631d-4cb8-bb23-47b4f233bc32%';

-- Check all credit ledger entries for this supplier
SELECT 'All supplier entries' as record_type, id, supplier_id, transaction_type, amount, reference_id, reference_type, description, balance_after, created_at
FROM public.credit_ledger 
WHERE supplier_id = '8c1f50aa-2026-4533-8077-d939a994d327'
ORDER BY created_at;