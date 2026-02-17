
-- Create consent_forms table
CREATE TABLE public.consent_forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  parent_full_name TEXT NOT NULL,
  parent_relationship TEXT NOT NULL,
  parent_phone TEXT,
  parent_email TEXT,
  parent_id_number TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,
  medical_conditions TEXT,
  allergies TEXT,
  medications TEXT,
  medical_aid_name TEXT,
  medical_aid_number TEXT,
  additional_notes TEXT,
  signature_acknowledged BOOLEAN NOT NULL DEFAULT false,
  signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.consent_forms ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can view consent forms"
ON public.consent_forms
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage consent forms"
ON public.consent_forms
FOR ALL
USING (is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_consent_forms_updated_at
BEFORE UPDATE ON public.consent_forms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add consent_signed flag to members for quick lookup
ALTER TABLE public.members ADD COLUMN consent_signed BOOLEAN NOT NULL DEFAULT false;
