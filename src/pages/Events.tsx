import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { useEvents, type CustomField, type CustomFieldType } from '@/hooks/useEvents';
import {
  Calendar,
  MapPin,
  Plus,
  Link as LinkIcon,
  Copy,
  Trash2,
  ImagePlus,
  X,
  GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: 'text', label: 'Short text' },
  { value: 'textarea', label: 'Long text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
];

const DEFAULT_FIELDS = {
  first_name: true,
  last_name: true,
  email: true,
  phone: true,
};

export default function Events() {
  const { events, isLoading, createEvent, toggleActive, deleteEvent } = useEvents();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    event_date: '',
    location: '',
    banner_url: '' as string,
  });
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  const resetForm = () => {
    setForm({ name: '', description: '', event_date: '', location: '', banner_url: '' });
    setCustomFields([]);
  };

  const uploadBanner = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `events/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('logos').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });
    if (error) {
      setUploading(false);
      toast.error(error.message || 'Upload failed');
      return;
    }
    const { data } = supabase.storage.from('logos').getPublicUrl(path);
    setForm((f) => ({ ...f, banner_url: data.publicUrl }));
    setUploading(false);
  };

  const addField = () => {
    setCustomFields((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        label: '',
        type: 'text',
        required: false,
      },
    ]);
  };

  const updateField = (id: string, patch: Partial<CustomField>) => {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.event_date) {
      toast.error('Name and date are required');
      return;
    }
    // Validate custom fields
    for (const f of customFields) {
      if (!f.label.trim()) {
        toast.error('All custom fields need a label');
        return;
      }
      if (f.type === 'select' && (!f.options || f.options.length === 0)) {
        toast.error(`Dropdown "${f.label}" needs at least one option`);
        return;
      }
    }
    setSaving(true);
    const created = await createEvent({
      ...form,
      banner_url: form.banner_url || null,
      custom_fields: customFields,
    });
    setSaving(false);
    if (created) {
      setOpen(false);
      resetForm();
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
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> New event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create event</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                {/* Banner */}
                <div>
                  <Label>Banner image</Label>
                  {form.banner_url ? (
                    <div className="relative mt-1.5 rounded-lg overflow-hidden border">
                      <img
                        src={form.banner_url}
                        alt="Banner"
                        className="w-full h-40 object-cover"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="absolute top-2 right-2 h-7 w-7"
                        onClick={() => setForm({ ...form, banner_url: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="mt-1.5 flex flex-col items-center justify-center gap-1 h-32 rounded-lg border-2 border-dashed cursor-pointer hover:bg-muted/40 transition-colors">
                      <ImagePlus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {uploading ? 'Uploading…' : 'Click to upload a banner'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadBanner(file);
                        }}
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    placeholder="Describe your event — shown on the public registration page"
                    rows={4}
                  />
                </div>

                {/* Custom fields builder */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Registration form fields</Label>
                      <p className="text-xs text-muted-foreground">
                        First name, last name, email and phone are included by default. Add
                        anything else you need.
                      </p>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={addField}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add field
                    </Button>
                  </div>

                  {customFields.length > 0 && (
                    <div className="space-y-2">
                      {customFields.map((field) => (
                        <div
                          key={field.id}
                          className="rounded-lg border p-3 space-y-2 bg-muted/20"
                        >
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                            <Input
                              placeholder="Field label (e.g. Dietary needs)"
                              value={field.label}
                              onChange={(e) =>
                                updateField(field.id, { label: e.target.value })
                              }
                            />
                            <Select
                              value={field.type}
                              onValueChange={(v) =>
                                updateField(field.id, { type: v as CustomFieldType })
                              }
                            >
                              <SelectTrigger className="w-[140px] shrink-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((t) => (
                                  <SelectItem key={t.value} value={t.value}>
                                    {t.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeField(field.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {field.type === 'select' && (
                            <Input
                              placeholder="Comma-separated options (e.g. Small, Medium, Large)"
                              value={(field.options ?? []).join(', ')}
                              onChange={(e) =>
                                updateField(field.id, {
                                  options: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                            />
                          )}

                          <div className="flex items-center gap-2 pl-6">
                            <Switch
                              id={`req-${field.id}`}
                              checked={field.required}
                              onCheckedChange={(v) => updateField(field.id, { required: v })}
                            />
                            <Label
                              htmlFor={`req-${field.id}`}
                              className="text-xs text-muted-foreground cursor-pointer"
                            >
                              Required
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={saving || uploading}>
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
              <Card key={ev.id} className="overflow-hidden">
                {ev.banner_url && (
                  <div className="aspect-[16/6] w-full bg-muted overflow-hidden">
                    <img
                      src={ev.banner_url}
                      alt={ev.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
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
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {ev.description}
                    </p>
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
                        if (confirm(`Delete "${ev.name}" and all registrations?`))
                          deleteEvent(ev.id);
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
