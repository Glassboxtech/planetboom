ALTER TABLE public.site_settings 
  ADD COLUMN IF NOT EXISTS favicon_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS foreground_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS muted_color text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Inter';