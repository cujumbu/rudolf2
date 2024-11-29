import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { TimeReport } from '../types';
import { generateReport, exportToCsv } from '../utils/time';
import { Download, Users } from 'lucide-react';
import { translations } from '../utils/translations';

const { admin: { dashboard }, common } = translations;

export const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<TimeReport[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState('');

  const fetchTimeReports = async () => {
    try {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee');

      const { data: entries } = await supabase
        .from('time_entries')
        .select('*')
        .gte('clock_in', `${startDate}T00:00:00`)
        .lte('clock_in', `${endDate}T23:59:59`);

      if (users && entries) {
        const formattedEntries = entries.map(entry => ({
          id: entry.id,
          userId: entry.user_id,
          clockIn: new Date(entry.clock_in),
          clockOut: entry.clock_out ? new Date(entry.clock_out) : null,
          stationId: entry.station_id
        }));

        const userMap = users.reduce((acc, user) => ({
          ...acc,
          [user.id]: {
            firstName: user.first_name,
            lastName: user.last_name
          }
        }), {});

        const generatedReports = generateReport(formattedEntries, userMap);
        setReports(generatedReports);
      }
    } catch (err) {
      console.error('Error fetching time reports:', err);
      setError(translations.errors.failedToLoad);
    }
  };

  useEffect(() => {
    fetchTimeReports();
  }, [startDate, endDate]);

  const handleExportCsv = () => {
    try {
      const csv = exportToCsv(reports);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timesheet-${startDate}-${endDate}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError(translations.errors.systemError);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Users className="w-5 h-5 mr-2" />
            {dashboard.timeReports}
          </h2>
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
            <button
              onClick={handleExportCsv}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {dashboard.exportCsv}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {common.name}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {dashboard.totalHours}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.userId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {report.userName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {report.totalHours}t {report.totalMinutes % 60}m
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};