import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers, Member } from '@/hooks/useMembers';
import { StatsCards } from '@/components/StatsCards';
import { MemberList } from '@/components/MemberList';
import { AddMemberDialog } from '@/components/AddMemberDialog';
import { EditMemberDialog } from '@/components/EditMemberDialog';
import { FilterTabs } from '@/components/FilterTabs';
import { NeighborhoodFilter } from '@/components/NeighborhoodFilter';
import { EventHeader } from '@/components/EventHeader';
import { AppLayout } from '@/components/AppLayout';
import { Search, Download, Upload } from 'lucide-react';
import { PrintToggle } from '@/components/PrintToggle';
import { printMemberLabel } from '@/components/PrintLabel';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel, importFromExcel } from '@/lib/excelUtils';

const Index = () => {
  const { isSuperAdmin } = useAuth();
  const {
    members,
    neighborhoods,
    todayAttendees,
    optimisticIds,
    stats,
    isLoading,
    toggleCheckIn,
    addMember,
    updateMember,
    deleteMember,
    flagMember,
    unflagMember,
    addNeighborhood,
    refetch,
  } = useMembers();

  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [printLabels, setPrintLabels] = useState(false);

  const handleToggleCheckIn = useCallback(async (memberId: string) => {
    const wasCheckedIn = todayAttendees.has(memberId);
    await toggleCheckIn(memberId);
    if (!wasCheckedIn && printLabels) {
      const member = members.find(m => m.id === memberId);
      if (member) {
        const today = new Date().toISOString().split('T')[0];
        printMemberLabel(member, today);
      }
    }
  }, [toggleCheckIn, todayAttendees, printLabels, members]);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const added = await importFromExcel(file, neighborhoods, addNeighborhood);
      if (added > 0) await refetch();
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [filter, setFilter] = useState<'all' | 'regular' | 'visitor'>('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string | null>(null);
  const [consentFilter, setConsentFilter] = useState<'all' | 'pending' | 'signed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getCurrentFriday = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
    const friday = new Date(today);
    friday.setDate(today.getDate() + (dayOfWeek === 5 ? 0 : daysUntilFriday));
    return friday.toISOString().split('T')[0];
  };

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.trim().toLowerCase();
    const query = searchQuery.toLowerCase();
    if (!fullName.includes(query) && !member.name.toLowerCase().includes(query)) return false;
    if (consentFilter === 'pending' && member.consent_signed) return false;
    if (consentFilter === 'signed' && !member.consent_signed) return false;
    return true;
  });

  const headerActions = (
    <>
      <Button variant="ghost" size="icon" title="Export to Excel" onClick={exportToExcel} className="text-muted-foreground hover:text-foreground">
        <Download className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        title="Import from Excel"
        onClick={() => fileInputRef.current?.click()}
        disabled={isImporting}
        className="text-muted-foreground hover:text-foreground"
      >
        {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      </Button>
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
      <PrintToggle enabled={printLabels} onToggle={() => setPrintLabels(p => !p)} />
      <AddMemberDialog onAddMember={addMember} neighborhoods={neighborhoods} />
    </>
  );

  return (
    <AppLayout title="Dashboard" subtitle="Friday Youth Group Attendance" headerActions={headerActions}>
      <div className="space-y-6">
        <StatsCards {...stats} />
        <EventHeader date={getCurrentFriday()} title="Friday Youth Night" />

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card border-border"
              />
            </div>
            <NeighborhoodFilter
              neighborhoods={neighborhoods}
              selectedNeighborhood={neighborhoodFilter}
              onNeighborhoodChange={setNeighborhoodFilter}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
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

        <div className="flex gap-2">
          {(['all', 'pending', 'signed'] as const).map((value) => {
            const label = value === 'all' ? 'All Consent' : value === 'pending' ? 'Pending' : 'Signed';
            const count = value === 'all' ? members.length : value === 'pending' ? members.filter(m => !m.consent_signed).length : members.filter(m => m.consent_signed).length;
            return (
              <button
                key={value}
                onClick={() => setConsentFilter(value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                  consentFilter === value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
                <span className="ml-1 opacity-60">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="pb-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <MemberList
              members={filteredMembers}
              todayAttendees={todayAttendees}
              optimisticIds={optimisticIds}
              onToggleCheckIn={handleToggleCheckIn}
              onDeleteMember={deleteMember}
              onFlagMember={flagMember}
              onUnflagMember={unflagMember}
              onEditMember={setEditingMember}
              filter={filter}
              neighborhoodFilter={neighborhoodFilter}
            />
          )}
        </div>

        {editingMember && (
          <EditMemberDialog
            member={editingMember}
            neighborhoods={neighborhoods}
            open={!!editingMember}
            onOpenChange={(open) => !open && setEditingMember(null)}
            onSave={updateMember}
          />
        )}
      </div>
    </AppLayout>
  );
};

export default Index;
