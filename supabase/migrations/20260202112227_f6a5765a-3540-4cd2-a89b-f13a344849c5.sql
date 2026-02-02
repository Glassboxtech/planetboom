-- Fix the overly permissive invitation viewing policy
-- Drop the existing policy that exposes all invitations
DROP POLICY IF EXISTS "Anyone can view invitations by token" ON public.invitations;

-- Create a new restrictive policy that only allows viewing a specific invitation by token
-- This requires the token to be passed as a parameter, not exposing all records
CREATE POLICY "View invitation by token only"
ON public.invitations
FOR SELECT
TO anon, authenticated
USING (false);

-- Note: We'll handle invitation lookup via an edge function that uses service role
-- This policy blocks direct client access to prevent token exposure