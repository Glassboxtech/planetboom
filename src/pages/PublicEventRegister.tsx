import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { z } from 'zod';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { CustomField } from '@/hooks/useEvents';

const baseSchema = z.object({
  first_name: z.string().trim().min(1, 'First name required').max(100),
  last_name: z.string().trim().min(1, 'Last name required').max(100),
  email: z.string().trim().email('Invalid email').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
});

interface EventRow {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  is_active: boolean;
  banner_url: string | null;
  custom_fields: CustomField[] | null;
}

export default function PublicEventRegister() {
  const { slug } = useParams<{ slug: string }>();
  const { settings } = useSiteSettings();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [customData, setCustomData] = useState<Record<string, string>>({});

  const customFields: CustomField[] = Array.isArray(event?.custom_fields)
    ? (event!.custom_fields as CustomField[])
    : [];

  useEffect(() => {
    (async () => {
      if (!slug) return;
      const { data, error } = await supabase
        .from('events')
        .select('id, name, description, event_date, location, is_active, banner_url, custom_fields')
        .eq('slug', slug)
        .maybeSingle();
      if (error) console.error(error);
      setEvent((data as unknown as EventRow) ?? null);
      setLoading(false);
    })();
  }, [slug]);

  const updateCustom = (id: string, value: string) => {
    setCustomData((prev) => ({ ...prev, [id]: value }));
  };

  const submit = async () => {
    if (!event) return;
    const parsed = baseSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    // Validate custom fields
    for (const f of customFields) {
      const value = (customData[f.id] ?? '').trim();
      if (f.required && !value) {
        toast.error(`${f.label} is required`);
        return;
      }
      if (value && f.type === 'email') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          toast.error(`${f.label} must be a valid email`);
          return;
        }
      }
      if (value && f.type === 'number' && Number.isNaN(Number(value))) {
        toast.error(`${f.label} must be a number`);
        return;
      }
    }

    // Build custom_data keyed by label for readability
    const custom_data: Record<string, string> = {};
    for (const f of customFields) {
      const v = (customData[f.id] ?? '').trim();
      if (v) custom_data[f.label] = v;
    }

    setSaving(true);
    const { error } = await supabase.from('event_registrations').insert({
      event_id: event.id,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      custom_data,
    });
    setSaving(false);
    if (error) {
      toast.error('Registration failed. Please try again.');
      return;
    }
    setSubmitted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!event || !event.is_active) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-10 text-center space-y-2">
            <h1 className="text-xl font-bold">Registration unavailable</h1>
            <p className="text-sm text-muted-foreground">
              This event may have closed or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderCustomField = (field: CustomField) => {
    const value = customData[field.id] ?? '';
    const common = {
      value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        updateCustom(field.id, e.target.value),
    };

    if (field.type === 'textarea') {
      return <Textarea rows={3} {...common} />;
    }
    if (field.type === 'select') {
      return (
        <Select value={value} onValueChange={(v) => updateCustom(field.id, v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    const typeMap: Record<string, string> = {
      email: 'email',
      phone: 'tel',
      number: 'number',
      date: 'date',
      text: 'text',
    };
    return <Input type={typeMap[field.type] ?? 'text'} {...common} />;
  };

  return (
    <div className="min-h-screen bg-muted/30 py-10 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-2">
          {settings?.logo_url && (
            <img
              src={settings.logo_url}
              alt={settings.app_name}
              className="h-12 mx-auto object-contain"
            />
          )}
          <p className="text-sm text-muted-foreground">
            {settings?.app_name || 'Event registration'}
          </p>
        </div>

        <Card className="overflow-hidden">
          {event.banner_url && (
            <div className="aspect-[16/7] w-full bg-muted overflow-hidden">
              <img
                src={event.banner_url}
                alt={event.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-2xl">{event.name}</CardTitle>
            <div className="flex flex-col gap-1.5 text-sm text-muted-foreground pt-2">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {format(new Date(event.event_date), 'EEEE, d MMMM yyyy')}
              </span>
              {event.location && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {event.location}
                </span>
              )}
            </div>
            {event.description && (
              <p className="text-sm text-muted-foreground pt-3 whitespace-pre-wrap">
                {event.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="h-14 w-14 text-primary mx-auto" />
                <h2 className="text-lg font-semibold">You're registered!</h2>
                <p className="text-sm text-muted-foreground">
                  We'll see you on {format(new Date(event.event_date), 'd MMM yyyy')}.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First name *</Label>
                    <Input
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Last name *</Label>
                    <Input
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>

                {customFields.map((field) => (
                  <div key={field.id}>
                    <Label>
                      {field.label}
                      {field.required && ' *'}
                    </Label>
                    {renderCustomField(field)}
                  </div>
                ))}

                <Button className="w-full" onClick={submit} disabled={saving}>
                  {saving ? 'Registering…' : 'Register'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
