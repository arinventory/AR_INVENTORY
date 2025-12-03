-- Fix supplier cascade delete constraints
-- This script ensures that when a supplier is deleted, all related records are also deleted

-- Fix wholesale_sales table to add ON DELETE CASCADE for supplier_id
ALTER TABLE public.wholesale_sales
DROP CONSTRAINT IF EXISTS wholesale_sales_supplier_id_fkey;

ALTER TABLE public.wholesale_sales
ADD CONSTRAINT wholesale_sales_supplier_id_fkey
FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;

-- Note: Most other supplier references already have ON DELETE CASCADE
-- The following tables already have proper CASCADE delete:
-- - wholesale_products (line 21)
-- - purchase_orders (line 36)
-- - credit_ledger (line 62)
-- - payments (line 158)

-- Also note that wholesale_sales has a supplier_id column that is optional (can be NULL)
-- This is because it can reference either a supplier or a customer (wholesale_buyers)