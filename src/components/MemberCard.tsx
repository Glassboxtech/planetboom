import { Check } from 'lucide-react';
import { Member } from '@/types';
import { cn } from '@/lib/utils';

interface MemberCardProps {
  member: Member;
  isCheckedIn: boolean;
  onToggle: () => void;
}

export function MemberCard({ member, isCheckedIn, onToggle }: MemberCardProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl transition-all animate-fade-in',
        'border-2 text-left',
        isCheckedIn
          ? 'bg-success/10 border-success shadow-card'
          : 'bg-card border-transparent shadow-card hover:shadow-hover hover:border-border'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg shrink-0 transition-all',
          isCheckedIn
            ? 'gradient-success text-success-foreground animate-check'
            : 'bg-secondary text-secondary-foreground'
        )}
      >
        {isCheckedIn ? (
          <Check className="w-6 h-6" />
        ) : (
          member.name.charAt(0).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">{member.name}</p>
          {member.type === 'visitor' && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning/20 text-warning-foreground">
              New
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {member.attendanceCount} {member.attendanceCount === 1 ? 'visit' : 'visits'}
        </p>
      </div>

      {/* Status indicator */}
      <div
        className={cn(
          'w-3 h-3 rounded-full shrink-0 transition-all',
          isCheckedIn ? 'bg-success' : 'bg-muted'
        )}
      />
    </button>
  );
}
