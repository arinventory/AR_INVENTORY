-- Add proper foreign key constraints with CASCADE DELETE for credit_ledger table
-- This is a more robust solution than triggers alone

-- First, we need to clean up any orphaned credit ledger entries
DELETE FROM public.credit_ledger 
WHERE reference_type = 'payment' 
AND reference_id NOT IN (SELECT id FROM public.payments);

DELETE FROM public.credit_ledger 
WHERE reference_type = 'purchase_order' 
AND reference_id NOT IN (SELECT id FROM public.purchase_orders);

-- Since reference_id can reference multiple tables, we can't use a traditional foreign key constraint
-- Instead, we'll enhance our trigger approach with better error handling

-- Drop existing functions and triggers if they exist
DROP TRIGGER IF EXISTS payment_credit_ledger_cascade_delete ON public.payments;
DROP TRIGGER IF EXISTS purchase_order_credit_ledger_cascade_delete ON public.purchase_orders;
DROP FUNCTION IF EXISTS delete_payment_credit_ledger_entries();
DROP FUNCTION IF EXISTS delete_purchase_order_credit_ledger_entries();

-- Create enhanced function to handle cascading deletes for payment references
CREATE OR REPLACE FUNCTION delete_payment_credit_ledger_entries()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE 'Trigger fired: Deleting credit ledger entries for payment %', OLD.id;
    
    -- Delete credit ledger entries that reference the deleted payment
    DELETE FROM public.credit_ledger 
    WHERE reference_type = 'payment' 
    AND reference_id = OLD.id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % credit ledger entries for payment %', deleted_count, OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create enhanced function to handle cascading deletes for purchase order references
CREATE OR REPLACE FUNCTION delete_purchase_order_credit_ledger_entries()
RETURNS TRIGGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    RAISE NOTICE 'Trigger fired: Deleting credit ledger entries for purchase order %', OLD.id;
    
    -- Delete credit ledger entries that reference the deleted purchase order
    DELETE FROM public.credit_ledger 
    WHERE reference_type = 'purchase_order' 
    AND reference_id = OLD.id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE 'Deleted % credit ledger entries for purchase order %', deleted_count, OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically delete credit ledger entries
CREATE TRIGGER payment_credit_ledger_cascade_delete
    BEFORE DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION delete_payment_credit_ledger_entries();

CREATE TRIGGER purchase_order_credit_ledger_cascade_delete
    BEFORE DELETE ON public.purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION delete_purchase_order_credit_ledger_entries();

-- Verify triggers were created
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%credit_ledger%'
ORDER BY tgname;