import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';

interface EventHeaderProps {
  date: string;
  title: string;
}

export function EventHeader({ date, title }: EventHeaderProps) {
  const eventDate = new Date(date + 'T00:00:00');
  const isToday = format(new Date(), 'yyyy-MM-dd') === date;
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="flex items-center gap-3 p-4 bg-card rounded-2xl shadow-card">
      <div className="w-12 h-12 rounded-xl gradient-warm flex items-center justify-center">
        <CalendarDays className="w-6 h-6 text-primary-foreground" />
      </div>
      <div>
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {formattedDate}
          {isToday && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-success/20 text-success">
              Today
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
