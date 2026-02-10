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
  flag_count: number;
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
  const [optimisticIds, setOptimisticIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const { isAdmin, assignedNeighborhoodId } = useAuth();

  const today = new Date().toISOString().split('T')[0];

  const fetchMembers = useCallback(async () => {
    if (!isAdmin) return;

    let query = supabase
      .from('members')
      .select('*, neighborhood:neighborhoods(id, name)')
      .order('name');

    // If admin is scoped to a neighborhood, only fetch those members
    if (assignedNeighborhoodId) {
      query = query.eq('neighborhood_id', assignedNeighborhoodId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching members:', error);
      toast.error('Failed to load members');
      return;
    }

    setMembers(data.map(m => ({
      ...m,
      type: m.type as 'regular' | 'visitor',
    })));
  }, [isAdmin, assignedNeighborhoodId]);

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
    
    // Optimistic update - immediately update UI
    setOptimisticIds(prev => new Set([...prev, memberId]));
    
    if (isCheckedIn) {
      // Optimistic: remove from checked in
      setTodayAttendees((prev) => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    } else {
      // Optimistic: add to checked in
      setTodayAttendees((prev) => new Set([...prev, memberId]));
    }

    try {
      if (isCheckedIn) {
        // Undo check-in
        const { error } = await supabase
          .from('attendance_records')
          .delete()
          .eq('member_id', memberId)
          .eq('event_date', today);

        if (error) throw error;

        // Decrement attendance count
        const member = members.find((m) => m.id === memberId);
        if (member) {
          await supabase
            .from('members')
            .update({ attendance_count: Math.max(0, member.attendance_count - 1) })
            .eq('id', memberId);
        }
      } else {
        // Check in
        const { error } = await supabase
          .from('attendance_records')
          .insert({ member_id: memberId, event_date: today });

        if (error) throw error;

        // Increment attendance count
        const member = members.find((m) => m.id === memberId);
        if (member) {
          await supabase
            .from('members')
            .update({ attendance_count: member.attendance_count + 1 })
            .eq('id', memberId);
        }
      }

      // Refresh members to get updated type (auto-promotion)
      await fetchMembers();
    } catch (error) {
      // Revert optimistic update on error
      toast.error(isCheckedIn ? 'Failed to undo check-in' : 'Failed to check in');
      if (isCheckedIn) {
        setTodayAttendees((prev) => new Set([...prev, memberId]));
      } else {
        setTodayAttendees((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      }
    } finally {
      setOptimisticIds(prev => {
        const next = new Set(prev);
        next.delete(memberId);
        return next;
      });
    }
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

  const flagMember = useCallback(async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member) return false;

    const newFlagCount = (member.flag_count || 0) + 1;
    
    const { error } = await supabase
      .from('members')
      .update({ flag_count: newFlagCount })
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to flag member');
      return false;
    }

    setMembers((prev) => 
      prev.map((m) => m.id === memberId ? { ...m, flag_count: newFlagCount } : m)
    );
    
    if (newFlagCount >= 3) {
      toast.warning(`${member.name} has been banned (3+ flags)`);
    } else {
      toast.success(`Flag added to ${member.name} (${newFlagCount}/3)`);
    }
    return true;
  }, [members]);

  const unflagMember = useCallback(async (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    if (!member || (member.flag_count || 0) === 0) return false;

    const newFlagCount = Math.max(0, (member.flag_count || 0) - 1);
    
    const { error } = await supabase
      .from('members')
      .update({ flag_count: newFlagCount })
      .eq('id', memberId);

    if (error) {
      toast.error('Failed to remove flag');
      return false;
    }

    setMembers((prev) => 
      prev.map((m) => m.id === memberId ? { ...m, flag_count: newFlagCount } : m)
    );
    toast.success(`Flag removed from ${member.name} (${newFlagCount}/3)`);
    return true;
  }, [members]);

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
    optimisticIds,
    stats,
    isLoading,
    toggleCheckIn,
    addMember,
    deleteMember,
    flagMember,
    unflagMember,
    addNeighborhood,
    refetch: fetchMembers,
  };
}
