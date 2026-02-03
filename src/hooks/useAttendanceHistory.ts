import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { subWeeks, format, startOfWeek, eachDayOfInterval, isFriday } from 'date-fns';

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

export function useAttendanceHistory(weeks: number = 4) {
  const [history, setHistory] = useState<DailyAttendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const fetchHistory = useCallback(async () => {
    if (!isAdmin) return;

    const startDate = subWeeks(new Date(), weeks);
    const startDateStr = format(startDate, 'yyyy-MM-dd');

    // Fetch attendance records with member type
    const { data: records, error } = await supabase
      .from('attendance_records')
      .select(`
        event_date,
        member_id,
        members!inner(type)
      `)
      .gte('event_date', startDateStr)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('Error fetching attendance history:', error);
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

    // Get all Fridays in the range for consistent charting
    const today = new Date();
    const fridays = eachDayOfInterval({ start: startDate, end: today })
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
      
      // Calculate trend (compare last 2 weeks vs previous 2 weeks)
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
    }
  }, [isAdmin, weeks]);

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
