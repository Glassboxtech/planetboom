
-- Add new columns to members table
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS address text;

-- Migrate existing name data into first_name/last_name
UPDATE public.members
SET 
  first_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from 1 for position(' ' in name) - 1)
    ELSE name
  END,
  last_name = CASE 
    WHEN position(' ' in name) > 0 THEN substring(name from position(' ' in name) + 1)
    ELSE ''
  END
WHERE first_name IS NULL;

-- Make first_name NOT NULL with a default
ALTER TABLE public.members ALTER COLUMN first_name SET DEFAULT '';
ALTER TABLE public.members ALTER COLUMN last_name SET DEFAULT '';

-- Update first_name to NOT NULL after migration
UPDATE public.members SET first_name = name WHERE first_name IS NULL;
UPDATE public.members SET last_name = '' WHERE last_name IS NULL;
ALTER TABLE public.members ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.members ALTER COLUMN last_name SET NOT NULL;
