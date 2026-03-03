import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Member, Neighborhood } from '@/hooks/useMembers';

interface EditMemberDialogProps {
  member: Member;
  neighborhoods: Neighborhood[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (memberId: string, updates: {
    first_name: string;
    last_name: string;
    gender: string | null;
    dob: string | null;
    status: string | null;
    address: string | null;
    phone: string | null;
    neighborhood_id: string | null;
    type: 'regular' | 'visitor';
  }) => Promise<boolean>;
}

export function EditMemberDialog({ member, neighborhoods, open, onOpenChange, onSave }: EditMemberDialogProps) {
  const [firstName, setFirstName] = useState(member.first_name);
  const [lastName, setLastName] = useState(member.last_name);
  const [gender, setGender] = useState(member.gender || '');
  const [phone, setPhone] = useState(member.phone || '');
  const [dob, setDob] = useState(member.dob || '');
  const [status, setStatus] = useState(member.status || '');
  const [address, setAddress] = useState(member.address || '');
  const [neighborhoodId, setNeighborhoodId] = useState(member.neighborhood_id || '');
  const [type, setType] = useState<'regular' | 'visitor'>(member.type);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setFirstName(member.first_name);
      setLastName(member.last_name);
      setGender(member.gender || '');
      setPhone(member.phone || '');
      setDob(member.dob || '');
      setStatus(member.status || '');
      setAddress(member.address || '');
      setNeighborhoodId(member.neighborhood_id || '');
      setType(member.type);
    }
  }, [open, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) return;

    setIsSubmitting(true);
    const success = await onSave(member.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      gender: gender || null,
      dob: dob || null,
      status: status || null,
      address: address.trim() || null,
      phone: phone.trim() || null,
      neighborhood_id: neighborhoodId === 'unknown' ? null : (neighborhoodId || null),
      type,
    });
    setIsSubmitting(false);
    if (success) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Member</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-firstName">First Name *</Label>
              <Input id="edit-firstName" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11" autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input id="edit-lastName" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input id="edit-dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="h-11" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Mobile</Label>
              <Input id="edit-phone" placeholder="555-0123" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-address">Address</Label>
            <Input id="edit-address" placeholder="Enter address" value={address} onChange={(e) => setAddress(e.target.value)} className="h-11" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Suburb</Label>
              <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select suburb" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  {neighborhoods.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'regular' | 'visitor')}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitor">New Visitor</SelectItem>
                  <SelectItem value="regular">Regular Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={!firstName.trim() || isSubmitting} className="flex-1 gradient-warm text-primary-foreground">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
