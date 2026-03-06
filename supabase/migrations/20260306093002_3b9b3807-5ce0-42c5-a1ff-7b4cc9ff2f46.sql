
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_name text NOT NULL DEFAULT 'Youth Check-In',
  logo_url text,
  primary_color text DEFAULT '220 75% 55%',
  accent_color text DEFAULT '160 55% 42%',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read settings
CREATE POLICY "Authenticated users can view site settings"
  ON public.site_settings FOR SELECT TO authenticated
  USING (true);

-- Only super admins can modify
CREATE POLICY "Super admins can manage site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'))
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Insert default row
INSERT INTO public.site_settings (app_name) VALUES ('Youth Check-In');
