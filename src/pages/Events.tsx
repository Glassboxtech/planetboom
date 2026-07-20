import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useEvents } from '@/hooks/useEvents';
import { Calendar, MapPin, Plus, Link as LinkIcon, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function Events() {
  const { events, isLoading, createEvent, toggleActive, deleteEvent } = useEvents();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', event_date: '', location: '' });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.event_date) {
      toast.error('Name and date are required');
      return;
    }
    setSaving(true);
    const created = await createEvent(form);
    setSaving(false);
    if (created) {
      setOpen(false);
      setForm({ name: '', description: '', event_date: '', location: '' });
    }
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/register/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Registration link copied');
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Events</h1>
            <p className="text-sm text-muted-foreground">
              Create events and share the public registration link.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create event</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Youth Camp 2026"
                  />
                </div>
                <div>
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={form.event_date}
                    onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional details shown on the registration page"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving}>
                  {saving ? 'Creating…' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No events yet. Click "New event" to create your first one.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((ev) => (
              <Card key={ev.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{ev.name}</CardTitle>
                    <Badge variant={ev.is_active ? 'default' : 'secondary'}>
                      {ev.is_active ? 'Active' : 'Closed'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(ev.event_date), 'EEE, d MMM yyyy')}
                  </div>
                  {ev.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" /> {ev.location}
                    </div>
                  )}
                  {ev.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button asChild size="sm">
                      <Link to={`/events/${ev.id}`}>View registrations</Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyLink(ev.slug)}>
                      <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy link
                    </Button>
                    <Button asChild size="sm" variant="ghost">
                      <a href={`/register/${ev.slug}`} target="_blank" rel="noreferrer">
                        <LinkIcon className="h-3.5 w-3.5 mr-1.5" /> Open
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleActive(ev.id, !ev.is_active)}
                    >
                      {ev.is_active ? 'Close' : 'Reopen'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete "${ev.name}" and all registrations?`)) deleteEvent(ev.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
