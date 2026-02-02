import { useState } from 'react';
import { useYouthGroup } from '@/hooks/useYouthGroup';
import { StatsCards } from '@/components/StatsCards';
import { MemberList } from '@/components/MemberList';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { FilterTabs } from '@/components/FilterTabs';
import { EventHeader } from '@/components/EventHeader';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const Index = () => {
  const {
    members,
    currentEvent,
    todayAttendees,
    stats,
    toggleCheckIn,
    addMember,
  } = useYouthGroup();

  const [filter, setFilter] = useState<'all' | 'regular' | 'visitor'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Youth Check-In
              </h1>
              <p className="text-sm text-muted-foreground">
                Friday Youth Group Attendance
              </p>
            </div>
            <AddMemberDialog onAddMember={addMember} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Stats */}
        <StatsCards {...stats} />

        {/* Current Event */}
        {currentEvent && (
          <EventHeader date={currentEvent.date} title={currentEvent.title} />
        )}

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card border-border"
            />
          </div>

          <FilterTabs
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={{
              all: members.length,
              regular: stats.regulars,
              visitor: stats.visitors,
            }}
          />
        </div>

        {/* Member List */}
        <div className="pb-6">
          <MemberList
            members={filteredMembers}
            todayAttendees={todayAttendees}
            onToggleCheckIn={toggleCheckIn}
            filter={filter}
          />
        </div>
      </main>
    </div>
  );
};

export default Index;
