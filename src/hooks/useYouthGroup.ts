import { useState, useCallback } from 'react';
import { Member, YouthEvent } from '@/types';
import { initialMembers, initialEvents } from '@/data/mockData';

export function useYouthGroup() {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [events, setEvents] = useState<YouthEvent[]>(initialEvents);
  const [todayAttendees, setTodayAttendees] = useState<Set<string>>(new Set());

  const currentEvent = events[0];

  const toggleCheckIn = useCallback((memberId: string) => {
    setTodayAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
        // Increment attendance count
        setMembers((prevMembers) =>
          prevMembers.map((m) =>
            m.id === memberId ? { ...m, attendanceCount: m.attendanceCount + 1 } : m
          )
        );
      }
      return next;
    });
  }, []);

  const addMember = useCallback((name: string, phone: string, type: 'regular' | 'visitor') => {
    const newMember: Member = {
      id: Date.now().toString(),
      name,
      phone: phone || undefined,
      type,
      firstVisit: new Date().toISOString().split('T')[0],
      attendanceCount: 0,
    };
    setMembers((prev) => [...prev, newMember]);
    return newMember;
  }, []);

  const updateMemberType = useCallback((memberId: string, type: 'regular' | 'visitor') => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, type } : m))
    );
  }, []);

  const stats = {
    totalMembers: members.length,
    regulars: members.filter((m) => m.type === 'regular').length,
    visitors: members.filter((m) => m.type === 'visitor').length,
    checkedInToday: todayAttendees.size,
  };

  return {
    members,
    events,
    currentEvent,
    todayAttendees,
    stats,
    toggleCheckIn,
    addMember,
    updateMemberType,
  };
}
