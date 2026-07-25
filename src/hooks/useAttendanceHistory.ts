import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, eachDayOfInterval, isFriday, subWeeks } from 'date-fns';

export interface DailyAttendance {
  date: string;
  displayDate: string;
  total: number;
  regulars: number;
  visitors: number;
}

export interface AttendanceStats {
  totalEvents: number;
  averageAttendance: number;
  peakAttendance: number;
  peakDate: string;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export function useAttendanceHistory(dateRange?: { from: Date; to: Date }) {
  const [history, setHistory] = useState<DailyAttendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const startDate = dateRange?.from ?? subWeeks(new Date(), 4);
  const endDate = dateRange?.to ?? new Date();

  const fetchHistory = useCallback(async () => {
    if (!isAdmin) return;

    const startDateStr = format(startDate, 'yyyy-MM-dd');
    const endDateStr = format(endDate, 'yyyy-MM-dd');

    const { data: records, error } = await supabase
      .from('attendance_records')
      .select(`
        event_date,
        member_id,
        members!inner(type)
      `)
      .gte('event_date', startDateStr)
      .lte('event_date', endDateStr)
      .order('event_date', { ascending: true });

    if (error) {
      if (import.meta.env.DEV) console.error('Error fetching attendance history:', error);
      else console.error('Failed to fetch attendance history');
      return;
    }

    // Group by date
    const byDate = new Map<string, { total: number; regulars: number; visitors: number }>();

    records?.forEach((record: any) => {
      const date = record.event_date;
      if (!byDate.has(date)) {
        byDate.set(date, { total: 0, regulars: 0, visitors: 0 });
      }
      const entry = byDate.get(date)!;
      entry.total++;
      if (record.members?.type === 'regular') {
        entry.regulars++;
      } else {
        entry.visitors++;
      }
    });

    // Get all Fridays in the range
    const fridays = eachDayOfInterval({ start: startDate, end: endDate })
      .filter(isFriday)
      .map((date) => format(date, 'yyyy-MM-dd'));

    const historyData: DailyAttendance[] = fridays.map((date) => {
      const entry = byDate.get(date) || { total: 0, regulars: 0, visitors: 0 };
      return {
        date,
        displayDate: format(new Date(date), 'MMM d'),
        total: entry.total,
        regulars: entry.regulars,
        visitors: entry.visitors,
      };
    });

    setHistory(historyData);

    // Calculate stats
    if (historyData.length > 0) {
      const eventsWithAttendance = historyData.filter((d) => d.total > 0);
      const totalAttendance = eventsWithAttendance.reduce((sum, d) => sum + d.total, 0);
      const averageAttendance = eventsWithAttendance.length > 0
        ? Math.round(totalAttendance / eventsWithAttendance.length)
        : 0;

      const peak = historyData.reduce((max, d) => (d.total > max.total ? d : max), historyData[0]);

      const midpoint = Math.floor(historyData.length / 2);
      const firstHalf = historyData.slice(0, midpoint);
      const secondHalf = historyData.slice(midpoint);

      const firstHalfAvg = firstHalf.length > 0
        ? firstHalf.reduce((sum, d) => sum + d.total, 0) / firstHalf.length
        : 0;
      const secondHalfAvg = secondHalf.length > 0
        ? secondHalf.reduce((sum, d) => sum + d.total, 0) / secondHalf.length
        : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      let trendPercentage = 0;

      if (firstHalfAvg > 0) {
        trendPercentage = Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
        if (trendPercentage > 5) trend = 'up';
        else if (trendPercentage < -5) trend = 'down';
      }

      setStats({
        totalEvents: eventsWithAttendance.length,
        averageAttendance,
        peakAttendance: peak.total,
        peakDate: peak.displayDate,
        trend,
        trendPercentage: Math.abs(trendPercentage),
      });
    } else {
      setStats(null);
    }
  }, [isAdmin, startDate.getTime(), endDate.getTime()]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchHistory();
      setIsLoading(false);
    };

    if (isAdmin) {
      load();
    }
  }, [isAdmin, fetchHistory]);

  return {
    history,
    stats,
    isLoading,
    refetch: fetchHistory,
  };
}
