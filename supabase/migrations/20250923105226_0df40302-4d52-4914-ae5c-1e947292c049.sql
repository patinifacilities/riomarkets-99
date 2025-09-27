-- Fix RLS policy for ui_events table - add view policy for users
CREATE POLICY "Users can view their own events" 
ON public.ui_events 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);