import { Member } from '@/hooks/useMembers';
import { MemberCard } from './MemberCard';

interface MemberListProps {
  members: Member[];
  todayAttendees: Set<string>;
  optimisticIds?: Set<string>;
  onToggleCheckIn: (memberId: string) => void;
  onDeleteMember?: (memberId: string) => void;
  onFlagMember?: (memberId: string) => void;
  filter: 'all' | 'regular' | 'visitor';
  neighborhoodFilter?: string | null;
}

export function MemberList({
  members,
  todayAttendees,
  optimisticIds = new Set(),
  onToggleCheckIn,
  onDeleteMember,
  onFlagMember,
  filter,
  neighborhoodFilter,
}: MemberListProps) {
  const filteredMembers = members.filter((member) => {
    // Type filter
    if (filter !== 'all' && member.type !== filter) return false;
    // Neighborhood filter
    if (neighborhoodFilter && member.neighborhood_id !== neighborhoodFilter) return false;
    return true;
  });

  // Sort: checked-in first, then by name
  const sortedMembers = [...filteredMembers].sort((a, b) => {
    const aChecked = todayAttendees.has(a.id);
    const bChecked = todayAttendees.has(b.id);
    if (aChecked && !bChecked) return -1;
    if (!aChecked && bChecked) return 1;
    return a.name.localeCompare(b.name);
  });

  if (sortedMembers.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>
          No {filter === 'all' ? 'members' : filter === 'regular' ? 'regulars' : 'visitors'} 
          {neighborhoodFilter ? ' in this suburb' : ''} yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedMembers.map((member) => (
        <MemberCard
          key={member.id}
          member={member}
          isCheckedIn={todayAttendees.has(member.id)}
          isOptimistic={optimisticIds.has(member.id)}
          onToggle={() => onToggleCheckIn(member.id)}
          onDelete={onDeleteMember ? () => onDeleteMember(member.id) : undefined}
          onFlag={onFlagMember ? () => onFlagMember(member.id) : undefined}
        />
      ))}
    </div>
  );
}
