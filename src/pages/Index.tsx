import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers } from '@/hooks/useMembers';
import { StatsCards } from '@/components/StatsCards';
import { MemberList } from '@/components/MemberList';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { FilterTabs } from '@/components/FilterTabs';
import { EventHeader } from '@/components/EventHeader';
import { Search, LogOut, Settings, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Navigate, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { user, isLoading: authLoading, signOut, isAdmin, isSuperAdmin } = useAuth();
  const {
    members,
    neighborhoods,
    todayAttendees,
    stats,
    isLoading,
    toggleCheckIn,
    addMember,
    deleteMember,
  } = useMembers();

  const [filter, setFilter] = useState<'all' | 'regular' | 'visitor'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get current Friday for event header
  const getCurrentFriday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    const friday = new Date(today);
    friday.setDate(today.getDate() + (dayOfWeek === 5 ? 0 : daysUntilFriday));
    return friday.toISOString().split('T')[0];
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You need admin privileges to access this app. Contact a Super Admin for an invitation.
          </p>
          <Button variant="outline" onClick={signOut}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Link to="/admin">
                  <Button variant="outline" size="icon">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <AddMemberDialog onAddMember={addMember} neighborhoods={neighborhoods} />
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* Stats */}
        <StatsCards {...stats} />

        {/* Current Event */}
        <EventHeader date={getCurrentFriday()} title="Friday Youth Night" />

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
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <MemberList
              members={filteredMembers}
              todayAttendees={todayAttendees}
              onToggleCheckIn={toggleCheckIn}
              onDeleteMember={deleteMember}
              filter={filter}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
