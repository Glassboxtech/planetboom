-- Add flag_count column for troublemaker tracking
ALTER TABLE public.members 
ADD COLUMN flag_count integer NOT NULL DEFAULT 0;

-- Add a comment explaining the column
COMMENT ON COLUMN public.members.flag_count IS 'Number of flags for troublemaker tracking. 3+ flags indicates banned/needs attention status.';