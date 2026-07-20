import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEventRegistrations } from '@/hooks/useEvents';
import { ArrowLeft, Check, Copy, Mail, Phone, Search } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { event, registrations, isLoading, toggleCheckIn } = useEventRegistrations(id);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return registrations;
    return registrations.filter(
      (r) =>
        r.first_name.toLowerCase().includes(s) ||
        r.last_name.toLowerCase().includes(s) ||
        (r.email ?? '').toLowerCase().includes(s) ||
        (r.phone ?? '').toLowerCase().includes(s)
    );
  }, [registrations, q]);

  const checkedIn = registrations.filter((r) => r.checked_in_at).length;

  const copyLink = () => {
    if (!event) return;
    navigator.clipboard.writeText(`${window.location.origin}/register/${event.slug}`);
    toast.success('Registration link copied');
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/events">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to events
          </Link>
        </Button>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !event ? (
          <p className="text-muted-foreground">Event not found.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{event.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(event.event_date), 'EEE, d MMM yyyy')}
                  {event.location ? ` · ${event.location}` : ''}
                </p>
              </div>
              <Button variant="outline" onClick={copyLink}>
                <Copy className="h-4 w-4 mr-2" /> Copy registration link
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Registered</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{registrations.length}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Checked in</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">{checkedIn}</CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Awaiting</CardTitle>
                </CardHeader>
                <CardContent className="text-2xl font-bold">
                  {registrations.length - checkedIn}
                </CardContent>
              </Card>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search registrants…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>

            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  {registrations.length === 0
                    ? 'No registrations yet. Share the link to get people signed up.'
                    : 'No matches for that search.'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filtered.map((r) => {
                  const isIn = !!r.checked_in_at;
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggleCheckIn(r)}
                      className={`w-full text-left p-4 rounded-lg border transition-all flex items-center justify-between ${
                        isIn
                          ? 'bg-primary/5 border-primary/40'
                          : 'bg-card border-border hover:border-primary/40'
                      }`}
                    >
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {r.first_name} {r.last_name}
                          {isIn && (
                            <Badge className="gap-1">
                              <Check className="h-3 w-3" /> Checked in
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex gap-3 mt-1">
                          {r.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" /> {r.email}
                            </span>
                          )}
                          {r.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" /> {r.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          isIn
                            ? 'bg-primary text-primary-foreground'
                            : 'border-2 border-muted-foreground/30'
                        }`}
                      >
                        {isIn && <Check className="h-4 w-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
