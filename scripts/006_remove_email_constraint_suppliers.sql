-- Remove NOT NULL constraint from email column in suppliers table
-- Since email has been removed from the UI, we need to make it nullable

ALTER TABLE public.suppliers
ALTER COLUMN email DROP NOT NULL;








