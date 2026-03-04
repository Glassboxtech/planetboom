import { cn } from '@/lib/utils';

interface FilterTabsProps {
  activeFilter: 'all' | 'regular' | 'visitor';
  onFilterChange: (filter: 'all' | 'regular' | 'visitor') => void;
  counts: {
    all: number;
    regular: number;
    visitor: number;
  };
}

export function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const tabs = [
    { value: 'all' as const, label: 'All', count: counts.all },
    { value: 'regular' as const, label: 'Regulars', count: counts.regular },
    { value: 'visitor' as const, label: 'Visitors', count: counts.visitor },
  ];

  return (
    <div className="flex gap-1 bg-secondary/60 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onFilterChange(tab.value)}
          className={cn(
            'flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all',
            activeFilter === tab.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
          <span className="ml-1.5 text-xs opacity-60">({tab.count})</span>
        </button>
      ))}
    </div>
  );
}
