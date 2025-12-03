-- Add foreign key constraint with CASCADE DELETE for credit_ledger reference_id -> payments
-- This ensures that when a payment is deleted, all corresponding credit ledger entries are automatically deleted

-- First, we need to clean up any orphaned credit ledger entries that reference non-existent payments
DELETE FROM public.credit_ledger 
WHERE reference_type = 'payment' 
AND reference_id NOT IN (SELECT id FROM public.payments);

-- Add the foreign key constraint with CASCADE DELETE
-- Since reference_id can reference multiple tables, we'll need to use a trigger approach
-- But first, let's add a comment to document the relationship
COMMENT ON COLUMN public.credit_ledger.reference_id IS 'References either payments.id or purchase_orders.id based on reference_type';

-- Create a function to handle cascading deletes for payment references
CREATE OR REPLACE FUNCTION delete_payment_credit_ledger_entries()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete credit ledger entries that reference the deleted payment
    DELETE FROM public.credit_ledger 
    WHERE reference_type = 'payment' 
    AND reference_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically delete credit ledger entries when a payment is deleted
DROP TRIGGER IF EXISTS payment_credit_ledger_cascade_delete ON public.payments;

CREATE TRIGGER payment_credit_ledger_cascade_delete
    BEFORE DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION delete_payment_credit_ledger_entries();

-- Similarly, create a function and trigger for purchase orders
CREATE OR REPLACE FUNCTION delete_purchase_order_credit_ledger_entries()
RETURNS TRIGGER AS $$
BEGIN
    -- Delete credit ledger entries that reference the deleted purchase order
    DELETE FROM public.credit_ledger 
    WHERE reference_type = 'purchase_order' 
    AND reference_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically delete credit ledger entries when a purchase order is deleted
DROP TRIGGER IF EXISTS purchase_order_credit_ledger_cascade_delete ON public.purchase_orders;

CREATE TRIGGER purchase_order_credit_ledger_cascade_delete
    BEFORE DELETE ON public.purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION delete_purchase_order_credit_ledger_entries();