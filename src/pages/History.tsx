import { useState } from 'react';
import { useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import { AppLayout } from '@/components/AppLayout';
import {
  TrendingUp, TrendingDown, Minus, Calendar as CalendarIcon, Users, Trophy, BarChart3, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { format, subWeeks, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

const PRESETS = [
  { label: 'Last 4 weeks', value: '4w' },
  { label: 'Last 8 weeks', value: '8w' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last year', value: '1y' },
  { label: 'Custom range', value: 'custom' },
] as const;

function getPresetRange(preset: string): { from: Date; to: Date } {
  const to = new Date();
  switch (preset) {
    case '4w': return { from: subWeeks(to, 4), to };
    case '8w': return { from: subWeeks(to, 8), to };
    case '3m': return { from: subMonths(to, 3), to };
    case '6m': return { from: subMonths(to, 6), to };
    case '1y': return { from: subMonths(to, 12), to };
    default: return { from: subWeeks(to, 4), to };
  }
}

const History = () => {
  const [preset, setPreset] = useState('4w');
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const isCustom = preset === 'custom';

  const dateRange = isCustom && customRange?.from && customRange?.to
    ? { from: customRange.from, to: customRange.to }
    : getPresetRange(preset);

  const { history, stats, isLoading } = useAttendanceHistory(dateRange);

  const TrendIcon = stats?.trend === 'up' ? TrendingUp : stats?.trend === 'down' ? TrendingDown : Minus;
  const trendColor = stats?.trend === 'up' ? 'text-accent' : stats?.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  const headerActions = (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={preset} onValueChange={(v) => setPreset(v)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isCustom && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className={cn(
              "justify-start text-left font-normal",
              !customRange?.from && "text-muted-foreground"
            )}>
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange?.from ? (
                customRange.to ? (
                  `${format(customRange.from, 'MMM d')} – ${format(customRange.to, 'MMM d, yyyy')}`
                ) : format(customRange.from, 'MMM d, yyyy')
              ) : 'Pick date range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={setCustomRange}
              numberOfMonths={2}
              disabled={(date) => date > new Date()}
              className="p-3 pointer-events-auto"
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );

  return (
    <AppLayout title="Attendance History" subtitle={`${format(dateRange.from, 'MMM d, yyyy')} – ${format(dateRange.to, 'MMM d, yyyy')}`} headerActions={headerActions}>
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><CalendarIcon className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.totalEvents || 0}</p>
                    <p className="text-xs text-muted-foreground">Events</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary"><Users className="w-5 h-5 text-secondary-foreground" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.averageAttendance || 0}</p>
                    <p className="text-xs text-muted-foreground">Avg/Event</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10"><Trophy className="w-5 h-5 text-accent" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats?.peakAttendance || 0}</p>
                    <p className="text-xs text-muted-foreground">Peak ({stats?.peakDate || 'N/A'})</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stats?.trend === 'up' ? 'bg-accent/10' : stats?.trend === 'down' ? 'bg-destructive/10' : 'bg-muted'}`}>
                    <TrendIcon className={`w-5 h-5 ${trendColor}`} />
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${trendColor}`}>
                      {stats?.trend === 'stable' ? '—' : `${stats?.trendPercentage}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stats?.trend === 'up' ? 'Growth' : stats?.trend === 'down' ? 'Decline' : 'Stable'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Area Chart - Attendance Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="displayDate" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={3} fill="url(#totalGradient)" dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No attendance data for this period</div>
              )}
            </CardContent>
          </Card>

          {/* Stacked Bar - Regulars vs Visitors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Regulars vs Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="displayDate" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Bar dataKey="regulars" name="Regulars" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="visitors" name="Visitors" stackId="a" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No attendance data for this period</div>
              )}
            </CardContent>
          </Card>

          {/* Weekly Breakdown Table */}
          <Card>
            <CardHeader><CardTitle>Weekly Breakdown</CardTitle></CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Regulars</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Visitors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...history].reverse().map((day) => (
                        <tr key={day.date} className="border-b border-border last:border-0">
                          <td className="py-3 px-4 text-sm font-medium">{day.displayDate}</td>
                          <td className="py-3 px-4 text-sm text-right">{day.total}</td>
                          <td className="py-3 px-4 text-sm text-right text-primary">{day.regulars}</td>
                          <td className="py-3 px-4 text-sm text-right text-accent">{day.visitors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">No attendance data for this period</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  );
};

export default History;
