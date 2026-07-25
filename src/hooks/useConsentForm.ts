import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ConsentForm {
  id: string;
  member_id: string;
  parent_full_name: string;
  parent_relationship: string;
  parent_phone: string | null;
  parent_email: string | null;
  parent_id_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  medical_conditions: string | null;
  allergies: string | null;
  medications: string | null;
  medical_aid_name: string | null;
  medical_aid_number: string | null;
  additional_notes: string | null;
  signature_acknowledged: boolean;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsentFormData {
  parent_full_name: string;
  parent_relationship: string;
  parent_phone: string;
  parent_email: string;
  parent_id_number: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relationship: string;
  medical_conditions: string;
  allergies: string;
  medications: string;
  medical_aid_name: string;
  medical_aid_number: string;
  additional_notes: string;
  signature_acknowledged: boolean;
}

export const emptyConsentFormData: ConsentFormData = {
  parent_full_name: '',
  parent_relationship: '',
  parent_phone: '',
  parent_email: '',
  parent_id_number: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  emergency_contact_relationship: '',
  medical_conditions: '',
  allergies: '',
  medications: '',
  medical_aid_name: '',
  medical_aid_number: '',
  additional_notes: '',
  signature_acknowledged: false,
};

export function useConsentForm(memberId: string | null) {
  const [consentForm, setConsentForm] = useState<ConsentForm | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConsentForm = useCallback(async () => {
    if (!memberId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('consent_forms')
      .select('*')
      .eq('member_id', memberId)
      .maybeSingle();

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching consent form:', error);
      else console.error('Failed to fetch consent form');
      toast.error('Failed to load consent form');
    } else {
      setConsentForm(data);
    }
    setIsLoading(false);
  }, [memberId]);

  const saveConsentForm = useCallback(async (formData: ConsentFormData) => {
    if (!memberId) return false;

    // Validate required fields
    if (!formData.parent_full_name.trim() || !formData.parent_relationship.trim()) {
      toast.error('Parent name and relationship are required');
      return false;
    }

    if (formData.parent_full_name.length > 200 || formData.parent_relationship.length > 100) {
      toast.error('Field values are too long');
      return false;
    }

    setIsSaving(true);
    try {
      const payload = {
        member_id: memberId,
        parent_full_name: formData.parent_full_name.trim(),
        parent_relationship: formData.parent_relationship.trim(),
        parent_phone: formData.parent_phone.trim() || null,
        parent_email: formData.parent_email.trim() || null,
        parent_id_number: formData.parent_id_number.trim() || null,
        emergency_contact_name: formData.emergency_contact_name.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || null,
        emergency_contact_relationship: formData.emergency_contact_relationship.trim() || null,
        medical_conditions: formData.medical_conditions.trim() || null,
        allergies: formData.allergies.trim() || null,
        medications: formData.medications.trim() || null,
        medical_aid_name: formData.medical_aid_name.trim() || null,
        medical_aid_number: formData.medical_aid_number.trim() || null,
        additional_notes: formData.additional_notes.trim() || null,
        signature_acknowledged: formData.signature_acknowledged,
        signed_at: formData.signature_acknowledged ? new Date().toISOString() : null,
      };

      let result;
      if (consentForm) {
        result = await supabase
          .from('consent_forms')
          .update(payload)
          .eq('id', consentForm.id)
          .select()
          .single();
      } else {
        result = await supabase
          .from('consent_forms')
          .insert(payload)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Update the member's consent_signed flag
      await supabase
        .from('members')
        .update({ consent_signed: formData.signature_acknowledged })
        .eq('id', memberId);

      setConsentForm(result.data);
      toast.success('Consent form saved successfully');
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving consent form:', error);
      else console.error('Failed to save consent form');
      toast.error('Failed to save consent form');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [memberId, consentForm]);

  return { consentForm, isLoading, isSaving, fetchConsentForm, saveConsentForm };
}
