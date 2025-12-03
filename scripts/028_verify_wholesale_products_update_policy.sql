-- Verify and ensure UPDATE policy exists for wholesale_products table
-- This is required for Row Level Security to allow stock updates when sales are made

-- Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'wholesale_products'
ORDER BY policyname;

-- Drop and recreate UPDATE policy to ensure it's correct
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.wholesale_products;

CREATE POLICY "Enable update for authenticated users" ON public.wholesale_products
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'wholesale_products' 
  AND cmd = 'UPDATE'
ORDER BY policyname;

