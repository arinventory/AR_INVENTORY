-- Remove unique constraint from SKU columns to allow duplicate SKUs
-- This allows products from the same or different suppliers to have the same SKU

-- Remove unique constraint from wholesale_products SKU column only
-- This allows products from the same or different suppliers to have the same SKU

-- Drop the unique constraint on wholesale_products.sku
ALTER TABLE public.wholesale_products 
DROP CONSTRAINT IF EXISTS wholesale_products_sku_key;

-- Add comment to document the change
COMMENT ON COLUMN public.wholesale_products.sku IS 'Product SKU - can be duplicated for different products even from the same supplier';

-- Function to drop unique constraint on a column regardless of constraint name
DO $$ 
DECLARE 
    constraint_name TEXT;
BEGIN
    -- Find and drop unique constraint on retail_products.sku
    SELECT conname INTO constraint_name
    FROM pg_constraint 
    WHERE conrelid = 'public.retail_products'::regclass 
    AND contype = 'u'
    AND conkey = ARRAY[
        (SELECT attnum FROM pg_attribute WHERE attrelid = 'public.retail_products'::regclass AND attname = 'sku')
    ];
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.retail_products DROP CONSTRAINT ' || quote_ident(constraint_name);
    END IF;
END $$;

-- Add comments to document the change
COMMENT ON COLUMN public.wholesale_products.sku IS 'Product SKU - can be duplicated for different products even from the same supplier';
COMMENT ON COLUMN public.retail_products.sku IS 'Product SKU - can be duplicated for different products';