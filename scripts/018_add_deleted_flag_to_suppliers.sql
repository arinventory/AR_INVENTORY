-- Add deleted flag to suppliers table to enable soft delete functionality
-- This allows us to hide deleted suppliers from the UI while preserving related records

-- Add deleted column to suppliers table
ALTER TABLE public.suppliers 
ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Add index for better query performance on deleted suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_deleted ON public.suppliers(deleted);

-- Add comment to document the column
COMMENT ON COLUMN public.suppliers.deleted IS 'Soft delete flag - when true, supplier is hidden from UI but related records preserved';