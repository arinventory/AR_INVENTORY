-- Script to identify and clean up orphaned credit ledger entries
-- This should be run to clean up any existing inconsistencies in the database

-- First, let's identify orphaned credit ledger entries that reference non-existent payments
SELECT 
    cl.id,
    cl.supplier_id,
    cl.reference_id,
    cl.reference_type,
    cl.description,
    cl.created_at
FROM credit_ledger cl
WHERE 
    cl.reference_type = 'payment' 
    AND cl.reference_id NOT IN (
        SELECT id FROM payments
    );

-- Let's also identify orphaned credit ledger entries that reference non-existent purchase orders
SELECT 
    cl.id,
    cl.supplier_id,
    cl.reference_id,
    cl.reference_type,
    cl.description,
    cl.created_at
FROM credit_ledger cl
WHERE 
    cl.reference_type = 'purchase_order' 
    AND cl.reference_id NOT IN (
        SELECT id FROM purchase_orders
    );

-- Now, let's delete the orphaned credit ledger entries that reference non-existent payments
DELETE FROM credit_ledger 
WHERE reference_type = 'payment' 
AND reference_id NOT IN (
    SELECT id FROM payments
);

-- And delete the orphaned credit ledger entries that reference non-existent purchase orders
DELETE FROM credit_ledger 
WHERE reference_type = 'purchase_order' 
AND reference_id NOT IN (
    SELECT id FROM purchase_orders
);

-- Verify that there are no more orphaned entries
SELECT COUNT(*) as remaining_orphaned_entries FROM credit_ledger cl
WHERE (cl.reference_type = 'payment' AND cl.reference_id NOT IN (SELECT id FROM payments))
   OR (cl.reference_type = 'purchase_order' AND cl.reference_id NOT IN (SELECT id FROM purchase_orders));

-- Optional: Recalculate all supplier balances to ensure consistency
-- This would require a more complex script that rebuilds the ledger chronologically
-- You can use the existing 013_recalculate_buyer_ledger.sql as a template for this if needed