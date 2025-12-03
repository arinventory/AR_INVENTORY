-- Script to completely recalculate buyer credit ledger balances
-- This should be run when there are inconsistencies in the ledger

-- WARNING: This is a complex operation that should be run with caution
-- Make sure to backup your database before running this script

BEGIN;

-- Step 1: Create a temporary table to store recalculated balances
CREATE TEMP TABLE temp_buyer_balances (
    customer_id UUID,
    transaction_id UUID,
    transaction_type TEXT,
    amount DECIMAL(12, 2),
    created_at TIMESTAMP WITH TIME ZONE,
    running_balance DECIMAL(12, 2)
);

-- Step 2: Insert all debit transactions (sales)
INSERT INTO temp_buyer_balances (customer_id, transaction_id, transaction_type, amount, created_at)
SELECT 
    ws.customer_id,
    ws.id,
    'debit',
    ws.total_amount,
    ws.created_at
FROM wholesale_sales ws
WHERE ws.customer_id IS NOT NULL
ORDER BY ws.created_at;

-- Step 3: Insert all credit transactions (payments)
INSERT INTO temp_buyer_balances (customer_id, transaction_id, transaction_type, amount, created_at)
SELECT 
    bp.customer_id,
    bp.id,
    'credit',
    bp.amount,
    bp.created_at
FROM buyer_payments bp
ORDER BY bp.created_at;

-- Step 4: Calculate running balances for each customer
-- This uses a window function to calculate cumulative sum
UPDATE temp_buyer_balances 
SET running_balance = (
    SELECT SUM(CASE WHEN tb2.transaction_type = 'debit' THEN tb2.amount ELSE -tb2.amount END)
    FROM temp_buyer_balances tb2
    WHERE tb2.customer_id = temp_buyer_balances.customer_id
    AND tb2.created_at <= temp_buyer_balances.created_at
    AND (
        tb2.created_at < temp_buyer_balances.created_at 
        OR (tb2.created_at = temp_buyer_balances.created_at AND tb2.transaction_id <= temp_buyer_balances.transaction_id)
    )
);

-- Step 5: Clear existing ledger entries
DELETE FROM buyer_credit_ledger;

-- Step 6: Insert recalculated entries
INSERT INTO buyer_credit_ledger (
    customer_id,
    transaction_type,
    amount,
    reference_id,
    reference_type,
    description,
    balance_after,
    created_at
)
SELECT 
    tb.customer_id,
    tb.transaction_type,
    tb.amount,
    tb.transaction_id,
    CASE 
        WHEN tb.transaction_type = 'debit' THEN 'wholesale_sale'
        WHEN tb.transaction_type = 'credit' THEN 'buyer_payment'
    END,
    CASE 
        WHEN tb.transaction_type = 'debit' THEN 'Sale ' || COALESCE((SELECT invoice_number FROM wholesale_sales WHERE id = tb.transaction_id), tb.transaction_id::TEXT)
        WHEN tb.transaction_type = 'credit' THEN 'Payment received ' || COALESCE((SELECT method FROM buyer_payments WHERE id = tb.transaction_id), '')
    END,
    tb.running_balance,
    tb.created_at
FROM temp_buyer_balances tb
ORDER BY tb.customer_id, tb.created_at, tb.transaction_id;

-- Step 7: Drop temporary table
DROP TABLE temp_buyer_balances;

COMMIT;

-- Verify the results
SELECT COUNT(*) as total_entries FROM buyer_credit_ledger;
SELECT SUM(balance_after) as total_balance FROM (
    SELECT DISTINCT ON (customer_id) 
        customer_id, 
        balance_after 
    FROM buyer_credit_ledger 
    ORDER BY customer_id, created_at DESC
) latest_balances;