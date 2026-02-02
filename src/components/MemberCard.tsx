import { Check, User, MapPin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Member {
  id: string;
  name: string;
  phone: string | null;
  type: 'regular' | 'visitor';
  attendance_count: number;
  neighborhood?: { id: string; name: string } | null;
}

interface MemberCardProps {
  member: Member;
  isCheckedIn: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export function MemberCard({ member, isCheckedIn, onToggle, onDelete }: MemberCardProps) {
  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer',
        isCheckedIn
          ? 'bg-primary/10 border-2 border-primary shadow-soft'
          : 'bg-card border border-border hover:border-primary/30 hover:shadow-soft'
      )}
      onClick={onToggle}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all',
          isCheckedIn
            ? 'gradient-warm text-primary-foreground animate-checkBounce'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isCheckedIn ? (
          <Check className="w-6 h-6" strokeWidth={3} />
        ) : (
          <User className="w-6 h-6" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-foreground truncate">{member.name}</h3>
          <span
            className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              member.type === 'regular'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-accent text-accent-foreground'
            )}
          >
            {member.type === 'regular' ? 'Regular' : 'Visitor'}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
          {member.neighborhood && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {member.neighborhood.name}
            </span>
          )}
          <span>{member.attendance_count} visits</span>
        </div>
      </div>

      {/* Delete button */}
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}

      {/* Check indicator */}
      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all',
          isCheckedIn
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-muted-foreground/30'
        )}
      >
        {isCheckedIn && <Check className="w-4 h-4" strokeWidth={3} />}
      </div>
    </div>
  );
}
