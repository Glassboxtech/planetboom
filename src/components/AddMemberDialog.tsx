import { useState } from 'react';
import { UserPlus } from 'lucide-react';
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
  onAddMember: (name: string, phone: string, type: 'regular' | 'visitor', neighborhoodId: string | null) => Promise<unknown>;
  neighborhoods: Neighborhood[];
}

export function AddMemberDialog({ onAddMember, neighborhoods }: AddMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'regular' | 'visitor'>('visitor');
  const [neighborhoodId, setNeighborhoodId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsSubmitting(true);
      await onAddMember(
        name.trim(),
        phone.trim(),
        type,
        neighborhoodId === 'unknown' ? null : (neighborhoodId || null)
      );
      setName('');
      setPhone('');
      setType('visitor');
      setNeighborhoodId('');
      setOpen(false);
      setIsSubmitting(false);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Person</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              placeholder="555-0123"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <Label>Neighborhood</Label>
            <Select value={neighborhoodId} onValueChange={setNeighborhoodId}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select neighborhood" />
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
              disabled={!name.trim() || isSubmitting}
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
