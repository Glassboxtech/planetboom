
CREATE POLICY "Admins can upload event banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'events'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can update event banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'events'
  AND public.is_admin(auth.uid())
);

CREATE POLICY "Admins can delete event banners"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'logos'
  AND (storage.foldername(name))[1] = 'events'
  AND public.is_admin(auth.uid())
);
