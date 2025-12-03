-- Test script to verify if the triggers are working correctly

-- First, let's check if we have any test data
SELECT 'payments' as table_name, COUNT(*) as count FROM public.payments
UNION ALL
SELECT 'credit_ledger' as table_name, COUNT(*) as count FROM public.credit_ledger
UNION ALL
SELECT 'purchase_orders' as table_name, COUNT(*) as count FROM public.purchase_orders;

-- Look for a payment that has credit ledger entries
SELECT p.id as payment_id, p.amount, cl.id as ledger_id, cl.transaction_type, cl.amount as ledger_amount
FROM public.payments p
JOIN public.credit_ledger cl ON cl.reference_id = p.id AND cl.reference_type = 'payment'
LIMIT 5;

-- If you found a payment ID above, replace 'TEST_PAYMENT_ID' with an actual payment ID
-- and run this to test the trigger:
-- DELETE FROM public.payments WHERE id = 'TEST_PAYMENT_ID';

-- After deletion, check if the credit ledger entries were removed:
-- SELECT * FROM public.credit_ledger WHERE reference_id = 'TEST_PAYMENT_ID' AND reference_type = 'payment';

-- Similarly for purchase orders:
-- SELECT po.id as po_id, po.total_amount, cl.id as ledger_id, cl.transaction_type, cl.amount as ledger_amount
-- FROM public.purchase_orders po
-- JOIN public.credit_ledger cl ON cl.reference_id = po.id AND cl.reference_type = 'purchase_order'
-- LIMIT 5;

-- To test purchase order deletion:
-- DELETE FROM public.purchase_orders WHERE id = 'TEST_PO_ID';

-- After deletion, check if the credit ledger entries were removed:
-- SELECT * FROM public.credit_ledger WHERE reference_id = 'TEST_PO_ID' AND reference_type = 'purchase_order';