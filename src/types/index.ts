export interface Member {
  id: string;
  name: string;
  phone?: string;
  type: 'regular' | 'visitor';
  firstVisit: string;
  attendanceCount: number;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string;
  checkedIn: boolean;
}

export interface YouthEvent {
  id: string;
  date: string;
  title: string;
  attendees: string[];
}
