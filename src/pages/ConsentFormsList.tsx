import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  Search,
  FileCheck,
  Clock,
  AlertTriangle,
  Download,
  Send,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ConsentListItem {
  id: string;
  member_id: string;
  parent_full_name: string;
  parent_relationship: string;
  parent_email: string | null;
  parent_phone: string | null;
  signature_acknowledged: boolean;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
  member: {
    id: string;
    name: string;
    first_name: string;
    last_name: string;
    dob: string | null;
    phone: string | null;
  };
}

interface MemberWithoutConsent {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  dob: string | null;
  phone: string | null;
  consent_signed: boolean;
}

export default function ConsentFormsList() {
  const navigate = useNavigate();
  const [consentForms, setConsentForms] = useState<ConsentListItem[]>([]);
  const [membersWithoutConsent, setMembersWithoutConsent] = useState<MemberWithoutConsent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'signed' | 'pending'>('all');
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<{ memberId: string; memberName: string; email: string; phone: string }>({ memberId: '', memberName: '', email: '', phone: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [formsRes, membersRes] = await Promise.all([
      supabase
        .from('consent_forms')
        .select('*, member:members(id, name, first_name, last_name, dob, phone)')
        .order('updated_at', { ascending: false }),
      supabase
        .from('members')
        .select('id, name, first_name, last_name, dob, phone, consent_signed')
        .eq('consent_signed', false)
        .order('name'),
    ]);

    if (formsRes.data) {
      setConsentForms(formsRes.data as unknown as ConsentListItem[]);
    }
    if (membersRes.data) {
      // Filter out members who already have a consent form entry
      const formMemberIds = new Set((formsRes.data || []).map((f: any) => f.member_id));
      setMembersWithoutConsent(
        membersRes.data.filter((m) => !formMemberIds.has(m.id))
      );
    }
    setIsLoading(false);
  };

  const allItems = useMemo(() => {
    const signed = consentForms.filter(f => f.signature_acknowledged);
    const pending = [
      ...consentForms.filter(f => !f.signature_acknowledged).map(f => ({
        type: 'form' as const,
        id: f.id,
        memberId: f.member_id,
        memberName: f.member?.name || 'Unknown',
        parentName: f.parent_full_name,
        parentEmail: f.parent_email,
        parentPhone: f.parent_phone,
        signedAt: null as string | null,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
        status: 'pending' as const,
      })),
      ...membersWithoutConsent.map(m => ({
        type: 'missing' as const,
        id: m.id,
        memberId: m.id,
        memberName: m.name || `${m.first_name} ${m.last_name}`.trim(),
        parentName: null as string | null,
        parentEmail: null as string | null,
        parentPhone: m.phone,
        signedAt: null as string | null,
        createdAt: null as string | null,
        updatedAt: null as string | null,
        status: 'pending' as const,
      })),
    ];

    const signedItems = signed.map(f => ({
      type: 'form' as const,
      id: f.id,
      memberId: f.member_id,
      memberName: f.member?.name || 'Unknown',
      parentName: f.parent_full_name,
      parentEmail: f.parent_email,
      parentPhone: f.parent_phone,
      signedAt: f.signed_at,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
      status: 'signed' as const,
    }));

    let items = filter === 'signed' ? signedItems : filter === 'pending' ? pending : [...signedItems, ...pending];

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.memberName.toLowerCase().includes(q) ||
        (i.parentName && i.parentName.toLowerCase().includes(q))
      );
    }

    return items;
  }, [consentForms, membersWithoutConsent, filter, search]);

  const signedCount = consentForms.filter(f => f.signature_acknowledged).length;
  const pendingCount = consentForms.filter(f => !f.signature_acknowledged).length + membersWithoutConsent.length;

  const handleDownload = (item: typeof allItems[0]) => {
    const form = consentForms.find(f => f.member_id === item.memberId);
    if (!form) {
      toast.error('No consent form data to download');
      return;
    }

    const content = `
CONSENT FORM
============

Child: ${item.memberName}
Status: ${form.signature_acknowledged ? 'SIGNED' : 'PENDING'}
${form.signed_at ? `Signed At: ${format(new Date(form.signed_at), 'PPpp')}` : ''}
Created: ${format(new Date(form.created_at), 'PPpp')}
Last Updated: ${format(new Date(form.updated_at), 'PPpp')}

PARENT / GUARDIAN INFORMATION
-----------------------------
Full Name: ${form.parent_full_name}
Relationship: ${form.parent_relationship}
Phone: ${form.parent_phone || 'N/A'}
Email: ${form.parent_email || 'N/A'}
ID Number: ${(form as any).parent_id_number || 'N/A'}

EMERGENCY CONTACT
-----------------
Name: ${(form as any).emergency_contact_name || 'N/A'}
Phone: ${(form as any).emergency_contact_phone || 'N/A'}
Relationship: ${(form as any).emergency_contact_relationship || 'N/A'}

MEDICAL INFORMATION
-------------------
Medical Conditions: ${(form as any).medical_conditions || 'None'}
Allergies: ${(form as any).allergies || 'None'}
Medications: ${(form as any).medications || 'None'}
Medical Aid: ${(form as any).medical_aid_name || 'N/A'}
Medical Aid Number: ${(form as any).medical_aid_number || 'N/A'}

ADDITIONAL NOTES
----------------
${(form as any).additional_notes || 'None'}

DECLARATION
-----------
Digital signature acknowledged: ${form.signature_acknowledged ? 'Yes' : 'No'}
${form.signed_at ? `Date signed: ${format(new Date(form.signed_at), 'PPpp')}` : ''}
`.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consent-form-${item.memberName.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Consent form downloaded');
  };

  const openSendDialog = (item: typeof allItems[0]) => {
    setSendTarget({
      memberId: item.memberId,
      memberName: item.memberName,
      email: item.parentEmail || '',
      phone: item.parentPhone || '',
    });
    setSendDialogOpen(true);
  };

  const handleSendConsent = async () => {
    if (!sendTarget.email && !sendTarget.phone) {
      toast.error('Please provide an email or phone number');
      return;
    }

    setSending(true);
    try {
      // Build the consent form URL
      const baseUrl = window.location.origin;
      const consentUrl = `${baseUrl}/consent?memberId=${sendTarget.memberId}`;

      if (sendTarget.email) {
        const { error } = await supabase.functions.invoke('send-consent-form', {
          body: {
            email: sendTarget.email,
            memberName: sendTarget.memberName,
            consentUrl,
          },
        });
        if (error) throw error;
        toast.success(`Consent form link sent to ${sendTarget.email}`);
      } else if (sendTarget.phone) {
        // For phone, copy the link to clipboard as a fallback
        await navigator.clipboard.writeText(
          `Hi! Please fill in the consent form for ${sendTarget.memberName}: ${consentUrl}`
        );
        toast.success('Message copied to clipboard! You can paste it into WhatsApp or SMS.');
      }

      setSendDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Failed to send consent form');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout title="Consent Forms" subtitle={`${signedCount} signed · ${pendingCount} pending`}>
      <div className="space-y-4">
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by child or parent name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All ({signedCount + pendingCount})</TabsTrigger>
              <TabsTrigger value="signed">Signed ({signedCount})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : allItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileCheck className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No consent forms found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {allItems.map((item) => (
              <Card
                key={`${item.type}-${item.id}`}
                className="hover:shadow-hover transition-shadow cursor-pointer"
                onClick={() => navigate(`/consent?memberId=${item.memberId}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-muted-foreground" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground truncate">{item.memberName}</span>
                        {item.status === 'signed' ? (
                          <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                            <FileCheck className="w-3 h-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {item.parentName && (
                          <span>Parent: {item.parentName}</span>
                        )}
                        {item.signedAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {format(new Date(item.signedAt), 'dd MMM yyyy, HH:mm')}
                          </span>
                        )}
                        {!item.signedAt && item.createdAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Created {format(new Date(item.createdAt), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {item.type === 'form' && item.status === 'signed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-foreground"
                          title="Download"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      {item.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                          title="Send to parent"
                          onClick={(e) => {
                            e.stopPropagation();
                            openSendDialog(item);
                          }}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Send Consent Form Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Consent Form</DialogTitle>
            <DialogDescription>
              Send a consent form link to the parent/guardian of <strong>{sendTarget.memberName}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="send-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="send-email"
                type="email"
                placeholder="parent@email.com"
                value={sendTarget.email}
                onChange={(e) => setSendTarget(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="relative flex items-center justify-center">
              <span className="px-2 bg-background text-xs text-muted-foreground">or</span>
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="send-phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Phone Number (copies link for WhatsApp/SMS)
              </Label>
              <Input
                id="send-phone"
                placeholder="+27 82 123 4567"
                value={sendTarget.phone}
                onChange={(e) => setSendTarget(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSendConsent}
              disabled={sending || (!sendTarget.email && !sendTarget.phone)}
              className="gradient-warm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {sendTarget.email ? 'Send Email' : 'Copy Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
