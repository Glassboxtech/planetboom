import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Neighborhood {
  id: string;
  name: string;
}

interface AddMemberDialogProps {
  onAddMember: (
    firstName: string,
    lastName: string,
    phone: string,
    type: 'regular' | 'visitor',
    neighborhoodId: string | null,
    gender: string | null,
    dob: string | null,
    status: string | null,
    address: string | null,
  ) => Promise<unknown>;
  neighborhoods: Neighborhood[];
}

export function AddMemberDialog({ onAddMember, neighborhoods }: AddMemberDialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [status, setStatus] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<'regular' | 'visitor'>('visitor');
  const [neighborhoodId, setNeighborhoodId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (firstName.trim()) {
      setIsSubmitting(true);
      const result = await onAddMember(
        firstName.trim(),
        lastName.trim(),
        phone.trim(),
        type,
        neighborhoodId === 'unknown' ? null : (neighborhoodId || null),
        gender || null,
        dob || null,
        status || null,
        address.trim() || null,
      );
      const newMemberId = (result as { id?: string } | null)?.id;
      setFirstName('');
      setLastName('');
      setGender('');
      setPhone('');
      setDob('');
      setStatus('');
      setAddress('');
      setType('visitor');
      setNeighborhoodId('');
      setOpen(false);
      setIsSubmitting(false);
      // Offer consent form for new member
      if (newMemberId) {
        const shouldConsent = window.confirm(
          'Would you like to fill in a consent form for this person? (e.g. if a parent/guardian is present)'
        );
        if (shouldConsent) {
          navigate(`/consent?memberId=${newMemberId}`);
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-warm text-primary-foreground shadow-soft hover:shadow-hover transition-all gap-2">
          <UserPlus className="w-4 h-4" />
          Add Person
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-11"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="h-11"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile</Label>
              <Input
                id="phone"
                placeholder="555-0123"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              placeholder="Enter address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Suburb</Label>
              <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select suburb" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Unknown</SelectItem>
                  {neighborhoods.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Member Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as 'regular' | 'visitor')}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitor">New Visitor</SelectItem>
                  <SelectItem value="regular">Regular Member</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!firstName.trim() || isSubmitting}
              className="flex-1 gradient-warm text-primary-foreground"
            >
              {isSubmitting ? 'Adding...' : 'Add Person'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
