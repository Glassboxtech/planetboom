import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Member {
  id: string;
  name: string;
  phone: string | null;
  type: 'regular' | 'visitor';
  neighborhood_id: string | null;
  first_visit: string;
  attendance_count: number;
  neighborhood?: { id: string; name: string } | null;
}

export interface Neighborhood {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
}

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [todayAttendees, setTodayAttendees] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin } = useAuth();

  const today = new Date().toISOString().split('T')[0];

  const fetchMembers = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('members')
      .select('*, neighborhood:neighborhoods(id, name)')
      .order('name');

    if (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
      return;
    }

    setMembers(data.map(m => ({
      ...m,
      type: m.type as 'regular' | 'visitor',
    })));
  }, [isAdmin]);

  const fetchNeighborhoods = useCallback(async () => {
    const { data, error } = await supabase
      .from('neighborhoods')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching neighborhoods:', error);
      return;
    }

    setNeighborhoods(data);
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    if (!isAdmin) return;

    const { data, error } = await supabase
      .from('attendance_records')
      .select('member_id')
      .eq('event_date', today);

    if (error) {
      console.error('Error fetching attendance:', error);
      return;
    }

    setTodayAttendees(new Set(data.map((r) => r.member_id)));
  }, [isAdmin, today]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMembers(), fetchNeighborhoods(), fetchTodayAttendance()]);
      setIsLoading(false);
    };

    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, fetchMembers, fetchNeighborhoods, fetchTodayAttendance]);

  const toggleCheckIn = useCallback(async (memberId: string) => {
    const isCheckedIn = todayAttendees.has(memberId);

    if (isCheckedIn) {
      // Undo check-in
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('member_id', memberId)
        .eq('event_date', today);

      if (error) {
        toast.error('Failed to undo check-in');
        return;
      }

      // Decrement attendance count
      const member = members.find((m) => m.id === memberId);
      if (member) {
        await supabase
          .from('members')
          .update({ attendance_count: Math.max(0, member.attendance_count - 1) })
          .eq('id', memberId);
      }

      setTodayAttendees((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    } else {
      // Check in
      const { error } = await supabase
        .from('attendance_records')
        .insert({ member_id: memberId, event_date: today });

      if (error) {
        toast.error('Failed to check in');
        return;
      }

      // Increment attendance count
      const member = members.find((m) => m.id === memberId);
      if (member) {
        await supabase
          .from('members')
          .update({ attendance_count: member.attendance_count + 1 })
          .eq('id', memberId);
      }

      setTodayAttendees((prev) => new Set([...prev, memberId]));
    }

    // Refresh members to get updated type (auto-promotion)
    await fetchMembers();
  }, [todayAttendees, members, today, fetchMembers]);

  const addMember = useCallback(async (
    name: string,
    phone: string,
    type: 'regular' | 'visitor',
    neighborhoodId: string | null
  ) => {
    const { data, error } = await supabase
      .from('members')
      .insert({
        name,
        phone: phone || null,
        type,
        neighborhood_id: neighborhoodId,
      })
      .select('*, neighborhood:neighborhoods(id, name)')
      .single();

    if (error) {
      toast.error('Failed to add member');
      return null;
    }

    setMembers((prev) => [...prev, { ...data, type: data.type as 'regular' | 'visitor' }]);
    toast.success('Member added successfully');
    return data;
  }, []);

  const deleteMember = useCallback(async (memberId: string) => {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to delete member');
      return false;
    }

    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    toast.success('Member deleted');
    return true;
  }, []);

  const addNeighborhood = useCallback(async (name: string, lat?: number, lng?: number) => {
    const { data, error } = await supabase
      .from('neighborhoods')
      .insert({
        name,
        latitude: lat || null,
        longitude: lng || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        toast.error('Neighborhood already exists');
      } else {
        toast.error('Failed to add neighborhood');
      }
      return null;
    }

    setNeighborhoods((prev) => [...prev, data]);
    toast.success('Neighborhood added');
    return data;
  }, []);

  const stats = {
    totalMembers: members.length,
    regulars: members.filter((m) => m.type === 'regular').length,
    visitors: members.filter((m) => m.type === 'visitor').length,
    checkedInToday: todayAttendees.size,
  };

  return {
    members,
    neighborhoods,
    todayAttendees,
    stats,
    isLoading,
    toggleCheckIn,
    addMember,
    deleteMember,
    addNeighborhood,
    refetch: fetchMembers,
  };
}
