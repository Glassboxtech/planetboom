import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAttendanceHistory } from '@/hooks/useAttendanceHistory';
import { AppLayout } from '@/components/AppLayout';
import { 
  TrendingUp, TrendingDown, Minus, Calendar, Users, Trophy, BarChart3, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const History = () => {
  const [weeks, setWeeks] = useState(4);
  const { history, stats, isLoading } = useAttendanceHistory(weeks);

  const TrendIcon = stats?.trend === 'up' ? TrendingUp : stats?.trend === 'down' ? TrendingDown : Minus;
  const trendColor = stats?.trend === 'up' ? 'text-accent' : stats?.trend === 'down' ? 'text-destructive' : 'text-muted-foreground';

  const headerActions = (
    <Select value={weeks.toString()} onValueChange={(v) => setWeeks(parseInt(v))}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="4">Last 4 weeks</SelectItem>
        <SelectItem value="8">Last 8 weeks</SelectItem>
        <SelectItem value="12">Last 12 weeks</SelectItem>
        <SelectItem value="24">Last 6 months</SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <AppLayout title="Attendance History" subtitle="Track growth and trends over time" headerActions={headerActions}>
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
                  <div className="p-2 rounded-lg bg-primary/10"><Calendar className="w-5 h-5 text-primary" /></div>
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

          {/* Charts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5" />Attendance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="displayDate" className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} />
                    <YAxis className="text-xs fill-muted-foreground" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="total" name="Total" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No attendance data for this period</div>
              )}
            </CardContent>
          </Card>

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
                    <Bar dataKey="regulars" name="Regulars" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="visitors" name="Visitors" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No attendance data for this period</div>
              )}
            </CardContent>
          </Card>

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
