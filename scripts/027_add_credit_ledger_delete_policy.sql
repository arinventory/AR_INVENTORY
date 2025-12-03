-- Add missing DELETE policy for credit_ledger table
-- This is required for Row Level Security to allow deletion of credit ledger entries
-- Without this policy, deletions will be silently blocked by RLS

-- Check if the policy already exists, and drop it if it does
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.credit_ledger;

-- Create the DELETE policy for credit_ledger
CREATE POLICY "Enable delete for authenticated users" ON public.credit_ledger
  FOR DELETE USING (auth.role() = 'authenticated');

-- Also add UPDATE policy if it doesn't exist (needed for balance recalculation)
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.credit_ledger;

CREATE POLICY "Enable update for authenticated users" ON public.credit_ledger
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Verify the policies were created
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
WHERE tablename = 'credit_ledger'
ORDER BY policyname;

