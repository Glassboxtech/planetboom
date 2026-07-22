import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'select';

export interface CustomField {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  options?: string[]; // for select
}

export interface EventItem {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  location: string | null;
  slug: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  banner_url: string | null;
  custom_fields: CustomField[];
}

export interface EventRegistration {
  id: string;
  event_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  checked_in_at: string | null;
  created_at: string;
  custom_data: Record<string, string | number | null>;
}

function makeSlug(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'event';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

function normalizeEvent(row: any): EventItem {
  return {
    ...row,
    banner_url: row.banner_url ?? null,
    custom_fields: Array.isArray(row.custom_fields) ? row.custom_fields : [],
  } as EventItem;
}

export function useEvents() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });
    if (error) {
      toast.error('Failed to load events');
      return;
    }
    setEvents((data ?? []).map(normalizeEvent));
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await fetchEvents();
      setIsLoading(false);
    })();
  }, [fetchEvents]);

  const createEvent = useCallback(
    async (input: {
      name: string;
      description?: string;
      event_date: string;
      location?: string;
      banner_url?: string | null;
      custom_fields?: CustomField[];
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) {
        toast.error('You must be signed in');
        return null;
      }
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: input.name,
          description: input.description || null,
          event_date: input.event_date,
          location: input.location || null,
          banner_url: input.banner_url || null,
          custom_fields: (input.custom_fields ?? []) as any,
          slug: makeSlug(input.name),
          created_by: userRes.user.id,
        })
        .select()
        .single();
      if (error) {
        toast.error(error.message || 'Failed to create event');
        return null;
      }
      const ev = normalizeEvent(data);
      setEvents((prev) => [ev, ...prev]);
      toast.success('Event created');
      return ev;
    },
    []
  );

  const toggleActive = useCallback(async (id: string, is_active: boolean) => {
    const { error } = await supabase.from('events').update({ is_active }).eq('id', id);
    if (error) {
      toast.error('Failed to update event');
      return;
    }
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, is_active } : e)));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete event');
      return;
    }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    toast.success('Event deleted');
  }, []);

  return { events, isLoading, createEvent, toggleActive, deleteEvent, refetch: fetchEvents };
}

export function useEventRegistrations(eventId: string | undefined) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!eventId) return;
    setIsLoading(true);
    const [{ data: ev }, { data: regs, error }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).maybeSingle(),
      supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true }),
    ]);
    if (error) toast.error('Failed to load registrations');
    setEvent(ev ? normalizeEvent(ev) : null);
    setRegistrations(
      ((regs as any[]) ?? []).map((r) => ({
        ...r,
        custom_data: r.custom_data ?? {},
      })) as EventRegistration[]
    );
    setIsLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleCheckIn = useCallback(async (reg: EventRegistration) => {
    const next = reg.checked_in_at ? null : new Date().toISOString();
    // optimistic
    setRegistrations((prev) =>
      prev.map((r) => (r.id === reg.id ? { ...r, checked_in_at: next } : r))
    );
    const { error } = await supabase
      .from('event_registrations')
      .update({ checked_in_at: next })
      .eq('id', reg.id);
    if (error) {
      toast.error('Failed to update check-in');
      setRegistrations((prev) =>
        prev.map((r) => (r.id === reg.id ? { ...r, checked_in_at: reg.checked_in_at } : r))
      );
    }
  }, []);

  return { event, registrations, isLoading, toggleCheckIn, refetch: load };
}
