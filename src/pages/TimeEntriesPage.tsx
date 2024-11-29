import React, { useState, useEffect } from 'react';
import { TimeEntryManagement } from '../components/TimeEntryManagement';
import { TimeEntry, User } from '../types';
import { supabase } from '../lib/supabase';
import { translations } from '../utils/translations';

const { admin: { timeEntries }, common, errors } = translations;

export const TimeEntriesPage: React.FC = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      // Fetch employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee');

      if (employeeError) throw employeeError;

      // Fetch time entries
      const { data: entries, error: entriesError } = await supabase
        .from('time_entries')
        .select('*')
        .gte('clock_in', `${startDate}T00:00:00`)
        .lte('clock_in', `${endDate}T23:59:59`);

      if (entriesError) throw entriesError;

      if (employeeData && entries) {
        const formattedEmployees: User[] = employeeData.map(emp => ({
          id: emp.id,
          email: emp.email,
          firstName: emp.first_name,
          lastName: emp.last_name,
          pin: emp.pin,
          role: emp.role,
          active: emp.active
        }));

        const formattedEntries = entries.map(entry => ({
          id: entry.id,
          userId: entry.user_id,
          clockIn: new Date(entry.clock_in),
          clockOut: entry.clock_out ? new Date(entry.clock_out) : null,
          stationId: entry.station_id
        }));

        setEmployees(formattedEmployees);
        setTimeEntries(formattedEntries);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(errors.failedToLoad);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const reports = employees.map(employee => ({
    userId: employee.id,
    userName: `${employee.firstName} ${employee.lastName}`,
    entries: timeEntries.filter(entry => entry.userId === employee.id)
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">{timeEntries.title}</h2>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm"
            />
            <span>{common.to}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <TimeEntryManagement
          reports={reports}
          onUpdate={fetchData}
        />
      </div>
    </div>
  );
};