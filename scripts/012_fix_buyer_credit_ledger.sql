-- Script to identify and fix inconsistencies in buyer credit ledger
-- This script helps resolve issues where deleted sales still have ledger entries

-- 1. First, let's identify orphaned ledger entries (entries that reference non-existent sales)
SELECT 
    bcl.id,
    bcl.customer_id,
    bcl.reference_id,
    bcl.reference_type,
    bcl.description,
    bcl.created_at
FROM buyer_credit_ledger bcl
WHERE 
    bcl.reference_type = 'wholesale_sale' 
    AND bcl.reference_id NOT IN (
        SELECT id FROM wholesale_sales
    );

-- 2. Check for orphaned payment entries
SELECT 
    bcl.id,
    bcl.customer_id,
    bcl.reference_id,
    bcl.reference_type,
    bp.reference_no,
    bp.amount,
    bcl.created_at
FROM buyer_credit_ledger bcl
JOIN buyer_payments bp ON bcl.reference_id = bp.id
WHERE 
    bcl.reference_type = 'buyer_payment' 
    AND bp.wholesale_sale_id IS NOT NULL
    AND bp.wholesale_sale_id != ''
    AND bp.wholesale_sale_id NOT IN (
        SELECT id FROM wholesale_sales
    );

-- 3. To fix the ledger, you can delete the orphaned entries:
-- DELETE FROM buyer_credit_ledger 
-- WHERE reference_type = 'wholesale_sale' 
-- AND reference_id NOT IN (SELECT id FROM wholesale_sales);

-- 4. After cleaning up, you might want to recalculate all balances
-- This would require a more complex script that rebuilds the ledger chronologically