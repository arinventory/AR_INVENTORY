-- Revert supplier cascade delete constraints
-- This script reverts the changes made to use hard delete and goes back to soft delete approach

-- Revert wholesale_sales table to remove ON DELETE CASCADE for supplier_id
-- Note: We're keeping the foreign key constraint but removing the CASCADE behavior
-- This is because we want to use soft delete instead of hard delete

-- The constraint will remain as is since it was already properly defined
-- ALTER TABLE public.wholesale_sales
-- DROP CONSTRAINT IF EXISTS wholesale_sales_supplier_id_fkey;

-- ALTER TABLE public.wholesale_sales
-- ADD CONSTRAINT wholesale_sales_supplier_id_fkey
-- FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);

-- Revert wholesale_sales_items table to remove ON DELETE CASCADE for product_id
-- ALTER TABLE public.wholesale_sales_items
-- DROP CONSTRAINT IF EXISTS wholesale_sales_items_product_id_fkey;

-- ALTER TABLE public.wholesale_sales_items
-- ADD CONSTRAINT wholesale_sales_items_product_id_fkey
-- FOREIGN KEY (product_id) REFERENCES public.wholesale_products(id);

-- Note: We're keeping the existing constraints as they were
-- The approach now is to use soft delete (deleted boolean flag) instead of hard delete with CASCADE