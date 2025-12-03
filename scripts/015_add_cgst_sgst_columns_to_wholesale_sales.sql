-- Add CGST and SGST percentage columns to wholesale_sales table
-- This allows tracking separate CGST and SGST percentages for each sale

-- Add CGST percentage column (default 0)
ALTER TABLE public.wholesale_sales 
ADD COLUMN IF NOT EXISTS cgst_percentage DECIMAL(5, 2) DEFAULT 0 NOT NULL;

-- Add SGST percentage column (default 0)
ALTER TABLE public.wholesale_sales 
ADD COLUMN IF NOT EXISTS sgst_percentage DECIMAL(5, 2) DEFAULT 0 NOT NULL;

-- Add comments to document the columns
COMMENT ON COLUMN public.wholesale_sales.cgst_percentage IS 'CGST percentage applied to this sale (default 0%)';
COMMENT ON COLUMN public.wholesale_sales.sgst_percentage IS 'SGST percentage applied to this sale (default 0%)';

-- Update existing records to set default percentages to 0 if NULL
UPDATE public.wholesale_sales 
SET cgst_percentage = 0 
WHERE cgst_percentage IS NULL;

UPDATE public.wholesale_sales 
SET sgst_percentage = 0 
WHERE sgst_percentage IS NULL;