
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS banner_url text,
  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS custom_data jsonb NOT NULL DEFAULT '{}'::jsonb;
