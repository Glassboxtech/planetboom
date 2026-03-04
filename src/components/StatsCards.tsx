import { Users, UserPlus, UserCheck, CalendarDays } from 'lucide-react';

interface StatsCardsProps {
  totalMembers: number;
  regulars: number;
  visitors: number;
  checkedInToday: number;
}

export function StatsCards({ totalMembers, regulars, visitors, checkedInToday }: StatsCardsProps) {
  const stats = [
    {
      label: 'Total Members',
      value: totalMembers,
      icon: Users,
      className: 'bg-card border border-border',
      iconClass: 'bg-primary/10 text-primary',
    },
    {
      label: 'Regulars',
      value: regulars,
      icon: UserCheck,
      className: 'bg-card border border-border',
      iconClass: 'bg-success/10 text-success',
    },
    {
      label: 'New Visitors',
      value: visitors,
      icon: UserPlus,
      className: 'bg-card border border-border',
      iconClass: 'bg-warning/10 text-warning',
    },
    {
      label: 'Checked In Today',
      value: checkedInToday,
      icon: CalendarDays,
      className: 'gradient-warm text-primary-foreground',
      iconClass: 'bg-white/20 text-white',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl p-5 shadow-card transition-all hover:shadow-hover ${stat.className}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.iconClass}`}>
              <stat.icon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          <p className="text-sm opacity-70 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
