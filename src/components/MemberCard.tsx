import { Check, User, MapPin, Trash2, Flag, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Member {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  gender: string | null;
  type: 'regular' | 'visitor';
  attendance_count: number;
  flag_count?: number;
  neighborhood?: { id: string; name: string } | null;
}

interface MemberCardProps {
  member: Member;
  isCheckedIn: boolean;
  isOptimistic?: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  onFlag?: () => void;
}

export function MemberCard({ 
  member, 
  isCheckedIn, 
  isOptimistic = false,
  onToggle, 
  onDelete,
  onFlag,
}: MemberCardProps) {
  const flagCount = member.flag_count || 0;
  const isBanned = flagCount >= 3;
  const needsAttention = flagCount >= 2 && flagCount < 3;
  const displayName = `${member.first_name} ${member.last_name}`.trim() || member.name;

  return (
    <div
      className={cn(
        'group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-200 cursor-pointer',
        'active:scale-[0.98] touch-manipulation',
        isBanned 
          ? 'bg-destructive/10 border-2 border-destructive/50'
          : needsAttention
          ? 'bg-warning/10 border-2 border-warning/50'
          : isCheckedIn
          ? 'bg-primary/10 border-2 border-primary shadow-soft'
          : 'bg-card border border-border hover:border-primary/30 hover:shadow-soft',
        isOptimistic && 'opacity-70'
      )}
      onClick={onToggle}
    >
      {isBanned && (
        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Banned
        </div>
      )}

      <div
        className={cn(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200',
          isBanned
            ? 'bg-destructive/20 text-destructive'
            : isCheckedIn
            ? 'gradient-warm text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
        style={{
          animation: isCheckedIn && !isOptimistic ? 'checkBounce 0.3s ease-out' : 'none'
        }}
      >
        {isCheckedIn ? (
          <Check className="w-6 h-6" strokeWidth={3} />
        ) : (
          <User className="w-6 h-6" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={cn(
            "font-semibold truncate",
            isBanned ? "text-destructive" : "text-foreground"
          )}>
            {displayName}
          </h3>
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
          {member.gender && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground capitalize">
              {member.gender}
            </span>
          )}
          {flagCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className={cn(
                    'flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-medium rounded-full',
                    isBanned 
                      ? 'bg-destructive text-destructive-foreground'
                      : needsAttention
                      ? 'bg-warning text-warning-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}>
                    <Flag className="w-3 h-3" />
                    {flagCount}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{flagCount} flag{flagCount !== 1 ? 's' : ''} - {isBanned ? 'Banned' : needsAttention ? 'Needs attention' : 'Flagged'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
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

      <div className="flex items-center gap-1">
        {onFlag && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'opacity-0 group-hover:opacity-100 transition-opacity',
                    flagCount > 0 ? 'text-warning hover:text-warning' : 'text-muted-foreground hover:text-warning'
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFlag();
                  }}
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add flag ({flagCount}/3)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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
      </div>

      <div
        className={cn(
          'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
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
