import { describe, it, expect } from 'vitest';
import { emptyConsentFormData, ConsentFormData } from '@/hooks/useConsentForm';

describe('ConsentForm data', () => {
  it('emptyConsentFormData has all required fields', () => {
    expect(emptyConsentFormData).toHaveProperty('parent_full_name', '');
    expect(emptyConsentFormData).toHaveProperty('parent_relationship', '');
    expect(emptyConsentFormData).toHaveProperty('parent_phone', '');
    expect(emptyConsentFormData).toHaveProperty('parent_email', '');
    expect(emptyConsentFormData).toHaveProperty('parent_id_number', '');
    expect(emptyConsentFormData).toHaveProperty('emergency_contact_name', '');
    expect(emptyConsentFormData).toHaveProperty('emergency_contact_phone', '');
    expect(emptyConsentFormData).toHaveProperty('emergency_contact_relationship', '');
    expect(emptyConsentFormData).toHaveProperty('medical_conditions', '');
    expect(emptyConsentFormData).toHaveProperty('allergies', '');
    expect(emptyConsentFormData).toHaveProperty('medications', '');
    expect(emptyConsentFormData).toHaveProperty('medical_aid_name', '');
    expect(emptyConsentFormData).toHaveProperty('medical_aid_number', '');
    expect(emptyConsentFormData).toHaveProperty('additional_notes', '');
    expect(emptyConsentFormData).toHaveProperty('signature_acknowledged', false);
  });

  it('signature_acknowledged defaults to false', () => {
    expect(emptyConsentFormData.signature_acknowledged).toBe(false);
  });

  it('all string fields default to empty string', () => {
    const stringFields = Object.entries(emptyConsentFormData).filter(
      ([key]) => key !== 'signature_acknowledged'
    );
    stringFields.forEach(([key, value]) => {
      expect(value).toBe('');
    });
  });
});
