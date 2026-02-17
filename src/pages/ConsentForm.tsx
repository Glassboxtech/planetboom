import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useConsentForm, ConsentFormData, emptyConsentFormData } from '@/hooks/useConsentForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Loader2, FileCheck, Shield } from 'lucide-react';

const ConsentFormPage = () => {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const memberId = searchParams.get('memberId');

  const [memberName, setMemberName] = useState('');
  const [memberDob, setMemberDob] = useState<string | null>(null);
  const [formData, setFormData] = useState<ConsentFormData>(emptyConsentFormData);

  const { consentForm, isLoading, isSaving, fetchConsentForm, saveConsentForm } =
    useConsentForm(memberId);

  // Fetch member info
  useEffect(() => {
    if (!memberId) return;
    const fetchMember = async () => {
      const { data } = await supabase
        .from('members')
        .select('first_name, last_name, name, dob')
        .eq('id', memberId)
        .single();
      if (data) {
        setMemberName(`${data.first_name} ${data.last_name}`.trim() || data.name);
        setMemberDob(data.dob);
      }
    };
    fetchMember();
    fetchConsentForm();
  }, [memberId, fetchConsentForm]);

  // Populate form when consent data loads
  useEffect(() => {
    if (consentForm) {
      setFormData({
        parent_full_name: consentForm.parent_full_name || '',
        parent_relationship: consentForm.parent_relationship || '',
        parent_phone: consentForm.parent_phone || '',
        parent_email: consentForm.parent_email || '',
        parent_id_number: consentForm.parent_id_number || '',
        emergency_contact_name: consentForm.emergency_contact_name || '',
        emergency_contact_phone: consentForm.emergency_contact_phone || '',
        emergency_contact_relationship: consentForm.emergency_contact_relationship || '',
        medical_conditions: consentForm.medical_conditions || '',
        allergies: consentForm.allergies || '',
        medications: consentForm.medications || '',
        medical_aid_name: consentForm.medical_aid_name || '',
        medical_aid_number: consentForm.medical_aid_number || '',
        additional_notes: consentForm.additional_notes || '',
        signature_acknowledged: consentForm.signature_acknowledged || false,
      });
    }
  }, [consentForm]);

  const isMinor = (() => {
    if (!memberDob) return null;
    const dob = new Date(memberDob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 18;
  })();

  const handleChange = (field: keyof ConsentFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await saveConsentForm(formData);
    if (success) navigate(-1);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/login" replace />;
  if (!memberId) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-primary" />
                Consent Form
              </h1>
              <p className="text-sm text-muted-foreground">
                {memberName}
                {isMinor === true && (
                  <span className="ml-2 text-xs bg-warning/20 text-warning-foreground px-2 py-0.5 rounded-full">
                    Minor (Under 18)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 max-w-2xl">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Parent/Guardian Info */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Parent / Guardian Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parent_full_name">Full Name *</Label>
                  <Input
                    id="parent_full_name"
                    placeholder="Parent's full name"
                    value={formData.parent_full_name}
                    onChange={(e) => handleChange('parent_full_name', e.target.value)}
                    maxLength={200}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Relationship *</Label>
                  <Select
                    value={formData.parent_relationship}
                    onValueChange={(v) => handleChange('parent_relationship', v)}
                    required
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="guardian">Legal Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="sibling">Sibling (18+)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">Phone</Label>
                  <Input
                    id="parent_phone"
                    placeholder="Phone number"
                    value={formData.parent_phone}
                    onChange={(e) => handleChange('parent_phone', e.target.value)}
                    maxLength={20}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_email">Email</Label>
                  <Input
                    id="parent_email"
                    type="email"
                    placeholder="Email address"
                    value={formData.parent_email}
                    onChange={(e) => handleChange('parent_email', e.target.value)}
                    maxLength={255}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="parent_id_number">ID Number</Label>
                  <Input
                    id="parent_id_number"
                    placeholder="ID / Passport number"
                    value={formData.parent_id_number}
                    onChange={(e) => handleChange('parent_id_number', e.target.value)}
                    maxLength={30}
                    className="h-11"
                  />
                </div>
              </div>
            </section>

            {/* Emergency Contact */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Emergency Contact
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_name">Contact Name</Label>
                  <Input
                    id="emergency_contact_name"
                    placeholder="Emergency contact name"
                    value={formData.emergency_contact_name}
                    onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                    maxLength={200}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                  <Input
                    id="emergency_contact_phone"
                    placeholder="Emergency phone"
                    value={formData.emergency_contact_phone}
                    onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                    maxLength={20}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="emergency_contact_relationship">Relationship</Label>
                  <Input
                    id="emergency_contact_relationship"
                    placeholder="e.g. Aunt, Uncle, Family friend"
                    value={formData.emergency_contact_relationship}
                    onChange={(e) => handleChange('emergency_contact_relationship', e.target.value)}
                    maxLength={100}
                    className="h-11"
                  />
                </div>
              </div>
            </section>

            {/* Medical Info */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Medical Information
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="medical_conditions">Medical Conditions</Label>
                  <Textarea
                    id="medical_conditions"
                    placeholder="Any known medical conditions..."
                    value={formData.medical_conditions}
                    onChange={(e) => handleChange('medical_conditions', e.target.value)}
                    maxLength={1000}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      placeholder="Any known allergies..."
                      value={formData.allergies}
                      onChange={(e) => handleChange('allergies', e.target.value)}
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medications">Current Medications</Label>
                    <Textarea
                      id="medications"
                      placeholder="Any medications being taken..."
                      value={formData.medications}
                      onChange={(e) => handleChange('medications', e.target.value)}
                      maxLength={500}
                      rows={2}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="medical_aid_name">Medical Aid Name</Label>
                    <Input
                      id="medical_aid_name"
                      placeholder="Medical aid provider"
                      value={formData.medical_aid_name}
                      onChange={(e) => handleChange('medical_aid_name', e.target.value)}
                      maxLength={100}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="medical_aid_number">Medical Aid Number</Label>
                    <Input
                      id="medical_aid_number"
                      placeholder="Member number"
                      value={formData.medical_aid_number}
                      onChange={(e) => handleChange('medical_aid_number', e.target.value)}
                      maxLength={50}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Additional Notes */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Additional Notes
              </h2>
              <Textarea
                id="additional_notes"
                placeholder="Any other information we should know..."
                value={formData.additional_notes}
                onChange={(e) => handleChange('additional_notes', e.target.value)}
                maxLength={1000}
                rows={3}
              />
            </section>

            {/* Signature */}
            <section className="space-y-4 bg-card border border-border rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Declaration & Consent
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                I, the undersigned parent/guardian, hereby give consent for{' '}
                <strong className="text-foreground">{memberName}</strong> to participate in
                youth group activities. I confirm that the information provided above is
                accurate. I understand that reasonable care will be taken but accept that
                participation is at own risk.
              </p>
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="signature"
                  checked={formData.signature_acknowledged}
                  onCheckedChange={(checked) =>
                    handleChange('signature_acknowledged', checked === true)
                  }
                  className="mt-0.5"
                />
                <Label htmlFor="signature" className="text-sm cursor-pointer leading-relaxed">
                  I agree and acknowledge this as my digital signature
                </Label>
              </div>
              {consentForm?.signed_at && (
                <p className="text-xs text-muted-foreground">
                  Previously signed on{' '}
                  {new Date(consentForm.signed_at).toLocaleDateString('en-ZA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              )}
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-2 pb-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  !formData.parent_full_name.trim() ||
                  !formData.parent_relationship
                }
                className="flex-1 gradient-warm text-primary-foreground"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : consentForm ? (
                  'Update Consent Form'
                ) : (
                  'Save Consent Form'
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

export default ConsentFormPage;
