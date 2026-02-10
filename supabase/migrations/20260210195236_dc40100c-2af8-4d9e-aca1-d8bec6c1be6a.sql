
-- Add neighborhood_id to user_roles (nullable - null means access to all neighborhoods)
ALTER TABLE public.user_roles 
ADD COLUMN neighborhood_id uuid REFERENCES public.neighborhoods(id) ON DELETE SET NULL;

-- Add neighborhood_id to invitations (nullable - null means full access)
ALTER TABLE public.invitations 
ADD COLUMN neighborhood_id uuid REFERENCES public.neighborhoods(id) ON DELETE SET NULL;

-- Create a function to get a user's assigned neighborhood
CREATE OR REPLACE FUNCTION public.get_user_neighborhood(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT neighborhood_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
