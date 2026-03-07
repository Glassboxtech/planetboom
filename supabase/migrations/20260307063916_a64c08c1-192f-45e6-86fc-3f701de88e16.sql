-- Create storage bucket for logo uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true);

-- Allow authenticated users to view logos
CREATE POLICY "Anyone can view logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Allow super admins to upload logos
CREATE POLICY "Super admins can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND public.has_role(auth.uid(), 'super_admin')
);

-- Allow super admins to update logos
CREATE POLICY "Super admins can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND public.has_role(auth.uid(), 'super_admin')
);

-- Allow super admins to delete logos
CREATE POLICY "Super admins can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND public.has_role(auth.uid(), 'super_admin')
);