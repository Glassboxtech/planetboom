import { Member } from '@/types';
import { MemberCard } from './MemberCard';

interface MemberListProps {
  members: Member[];
  todayAttendees: Set<string>;
  onToggleCheckIn: (memberId: string) => void;
  filter: 'all' | 'regular' | 'visitor';
}

export function MemberList({ members, todayAttendees, onToggleCheckIn, filter }: MemberListProps) {
  const filteredMembers = members.filter((member) => {
    if (filter === 'all') return true;
    return member.type === filter;
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
        <p>No {filter === 'all' ? 'members' : filter === 'regular' ? 'regulars' : 'visitors'} yet.</p>
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
          onToggle={() => onToggleCheckIn(member.id)}
        />
      ))}
    </div>
  );
}
