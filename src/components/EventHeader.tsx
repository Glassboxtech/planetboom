import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface EventHeaderProps {
  date: string;
  title: string;
  onDateChange?: (date: string) => void;
}

export function EventHeader({ date, title, onDateChange }: EventHeaderProps) {
  const eventDate = new Date(date + 'T00:00:00');
  const isToday = format(new Date(), 'yyyy-MM-dd') === date;
  const formattedDate = format(eventDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl shadow-card">
      <div className="w-11 h-11 rounded-lg gradient-warm flex items-center justify-center">
        <CalendarDays className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <h2 className="font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {formattedDate}
          {isToday && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-success/15 text-success">
              Today
            </span>
          )}
        </p>
      </div>
      {onDateChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarDays className="w-4 h-4" />
              Change Date
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={(d) => {
                if (d) {
                  onDateChange(format(d, 'yyyy-MM-dd'));
                }
              }}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
