import { Member, YouthEvent } from '@/types';

// Get the current Friday or next Friday
const getCurrentFriday = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 7 - dayOfWeek + 5;
  const friday = new Date(today);
  friday.setDate(today.getDate() + (dayOfWeek === 5 ? 0 : daysUntilFriday));
  return friday.toISOString().split('T')[0];
};

export const initialMembers: Member[] = [
  { id: '1', name: 'Sarah Johnson', phone: '555-0101', type: 'regular', firstVisit: '2024-01-05', attendanceCount: 42 },
  { id: '2', name: 'Marcus Williams', phone: '555-0102', type: 'regular', firstVisit: '2024-02-09', attendanceCount: 38 },
  { id: '3', name: 'Emily Chen', phone: '555-0103', type: 'regular', firstVisit: '2024-01-12', attendanceCount: 40 },
  { id: '4', name: 'David Thompson', phone: '555-0104', type: 'regular', firstVisit: '2024-03-01', attendanceCount: 35 },
  { id: '5', name: 'Jessica Martinez', phone: '555-0105', type: 'regular', firstVisit: '2024-06-14', attendanceCount: 20 },
  { id: '6', name: 'Chris Anderson', phone: '555-0106', type: 'visitor', firstVisit: '2025-01-24', attendanceCount: 2 },
  { id: '7', name: 'Aisha Patel', phone: '555-0107', type: 'visitor', firstVisit: '2025-01-31', attendanceCount: 1 },
];

export const initialEvents: YouthEvent[] = [
  { id: '1', date: getCurrentFriday(), title: 'Friday Youth Night', attendees: [] },
];
