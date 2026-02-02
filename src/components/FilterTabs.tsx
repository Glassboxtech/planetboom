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
    <div className="flex gap-2 bg-secondary/50 p-1.5 rounded-xl">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onFilterChange(tab.value)}
          className={cn(
            'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all',
            activeFilter === tab.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
          <span className="ml-2 text-xs opacity-70">({tab.count})</span>
        </button>
      ))}
    </div>
  );
}
