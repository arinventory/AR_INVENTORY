-- Fix foreign key constraints to allow cascade delete for wholesale sales

-- Drop and recreate the foreign key constraint on buyer_payments table
ALTER TABLE public.buyer_payments
DROP CONSTRAINT IF EXISTS buyer_payments_wholesale_sale_id_fkey;

ALTER TABLE public.buyer_payments
ADD CONSTRAINT buyer_payments_wholesale_sale_id_fkey
FOREIGN KEY (wholesale_sale_id) REFERENCES public.wholesale_sales(id) ON DELETE CASCADE;

-- Note: For buyer_credit_ledger, the reference_id is a generic field that can reference different tables
-- based on the reference_type field. We can't add a direct foreign key constraint here.
-- The application logic should handle cleanup of related records.