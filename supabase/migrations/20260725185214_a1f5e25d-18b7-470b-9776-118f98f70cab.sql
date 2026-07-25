-- Restrict SECURITY DEFINER function execution to authenticated users only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_user_neighborhood(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_neighborhood(uuid) TO authenticated, service_role;

-- Prevent anonymous listing of the logos storage bucket.
-- Public URL fetches still work (bucket is public and served via CDN),
-- but arbitrary listing/enumeration through the storage API is now blocked.
DROP POLICY IF EXISTS "Anyone can view logos" ON storage.objects;
CREATE POLICY "Authenticated users can view logos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'logos');
