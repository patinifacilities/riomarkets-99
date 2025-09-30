-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Everyone can view active fast pools" ON public.fast_pools;
DROP POLICY IF EXISTS "Admin can manage fast pools" ON public.fast_pools;
DROP POLICY IF EXISTS "Users can create their own fast pool bets" ON public.fast_pool_bets;
DROP POLICY IF EXISTS "Users can view their own fast pool bets" ON public.fast_pool_bets;
DROP POLICY IF EXISTS "Admin can view all fast pool bets" ON public.fast_pool_bets;
DROP POLICY IF EXISTS "Everyone can view fast pool results" ON public.fast_pool_results;
DROP POLICY IF EXISTS "Admin can manage fast pool results" ON public.fast_pool_results;

-- Recreate policies
CREATE POLICY "Everyone can view fast pools" 
ON public.fast_pools 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage fast pools" 
ON public.fast_pools 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Users can create fast pool bets" 
ON public.fast_pool_bets 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own fast pool bets" 
ON public.fast_pool_bets 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Admin can view all bets" 
ON public.fast_pool_bets 
FOR SELECT 
USING (is_current_user_admin());

CREATE POLICY "Everyone can view results" 
ON public.fast_pool_results 
FOR SELECT 
USING (true);

CREATE POLICY "Admin can manage results" 
ON public.fast_pool_results 
FOR ALL 
USING (is_current_user_admin());