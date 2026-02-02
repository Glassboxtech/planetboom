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
      className: 'bg-card',
    },
    {
      label: 'Regulars',
      value: regulars,
      icon: UserCheck,
      className: 'bg-card',
    },
    {
      label: 'New Visitors',
      value: visitors,
      icon: UserPlus,
      className: 'bg-card',
    },
    {
      label: 'Checked In Today',
      value: checkedInToday,
      icon: CalendarDays,
      className: 'gradient-warm text-primary-foreground',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-2xl p-5 shadow-card transition-all hover:shadow-hover ${stat.className}`}
        >
          <div className="flex items-center justify-between mb-3">
            <stat.icon className="w-5 h-5 opacity-70" />
          </div>
          <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
          <p className="text-sm opacity-70 mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
