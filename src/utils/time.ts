import { differenceInMinutes, format } from 'date-fns';
import { TimeEntry, TimeReport } from '../types';

export const calculateDuration = (entry: TimeEntry): number => {
  if (!entry.clockOut) return 0;
  return differenceInMinutes(new Date(entry.clockOut), new Date(entry.clockIn));
};

export const generateReport = (
  entries: TimeEntry[],
  users: Record<string, { firstName: string; lastName: string }>
): TimeReport[] => {
  const reportByUser = new Map<string, TimeReport>();

  entries.forEach((entry) => {
    const userId = entry.userId;
    const user = users[userId];
    
    // Skip entries for users that don't exist in the userMap
    if (!user) return;
    
    const duration = calculateDuration(entry);

    if (!reportByUser.has(userId)) {
      reportByUser.set(userId, {
        userId,
        userName: `${user.firstName} ${user.lastName}`,
        totalHours: 0,
        totalMinutes: 0,
        entries: [],
      });
    }

    const report = reportByUser.get(userId)!;
    report.entries.push(entry);
    report.totalMinutes += duration;
    report.totalHours = Math.floor(report.totalMinutes / 60);
  });

  return Array.from(reportByUser.values());
};

export const exportToCsv = (reports: TimeReport[]): string => {
  const headers = ['Employee Name', 'Date', 'Clock In', 'Clock Out', 'Hours'];
  const rows = reports.flatMap((report) =>
    report.entries.map((entry) => [
      report.userName,
      format(new Date(entry.clockIn), 'yyyy-MM-dd'),
      format(new Date(entry.clockIn), 'HH:mm'),
      entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm') : '',
      (calculateDuration(entry) / 60).toFixed(2),
    ])
  );

  return [headers, ...rows].map((row) => row.join(',')).join('\n');
};