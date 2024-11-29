export interface User {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  firstName: string;
  lastName: string;
  pin: string | null;
  active: boolean;
}

export interface TimeEntry {
  id: string;
  userId: string;
  clockIn: Date;
  clockOut: Date | null;
  stationId: string;
}

export interface Station {
  id: string;
  name: string;
  location: string;
  deviceId: string;
  isActive: boolean;
}

export interface TimeReport {
  userId: string;
  userName: string;
  totalHours: number;
  totalMinutes: number;
  entries: TimeEntry[];
}