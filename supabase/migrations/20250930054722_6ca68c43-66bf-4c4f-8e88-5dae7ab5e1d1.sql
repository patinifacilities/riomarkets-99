-- Enable RLS on fast_pool_results table for proper access control
ALTER TABLE public.fast_pool_results ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view results
CREATE POLICY "Everyone can view fast pool results"
ON public.fast_pool_results
FOR SELECT
USING (true);

-- Allow admin/system to insert results
CREATE POLICY "Admin can insert fast pool results"
ON public.fast_pool_results
FOR INSERT
WITH CHECK (true);