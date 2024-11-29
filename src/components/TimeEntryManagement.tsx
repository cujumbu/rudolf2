import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { TimeEntry, User } from '../types';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import { Clock, Edit } from 'lucide-react';
import { translations } from '../utils/translations';

const { admin: { timeEntries }, common } = translations;

interface TimeEntryManagementProps {
  reports: {
    userId: string;
    userName: string;
    entries: TimeEntry[];
  }[];
  onUpdate: () => void;
}

export const TimeEntryManagement: React.FC<TimeEntryManagementProps> = ({ reports, onUpdate }) => {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [error, setError] = useState('');

  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;

    try {
      const { error: updateError } = await supabase
        .from('time_entries')
        .update({
          clock_in: editingEntry.clockIn.toISOString(),
          clock_out: editingEntry.clockOut?.toISOString() || null,
        })
        .eq('id', editingEntry.id);

      if (updateError) throw updateError;

      setEditingEntry(null);
      onUpdate();
    } catch (err) {
      console.error('Error updating time entry:', err);
      setError(translations.errors.updateFailed);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          {timeEntries.management}
        </h2>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {reports.map((report) => (
          <div key={report.userId} className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-4">{report.userName}</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {common.date}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {timeEntries.clockInTime}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {timeEntries.clockOutTime}
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {common.actions}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(entry.clockIn), 'd. MMMM yyyy', { locale: da })}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {format(new Date(entry.clockIn), 'HH:mm')}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {entry.clockOut
                          ? format(new Date(entry.clockOut), 'HH:mm')
                          : timeEntries.stillClockedIn}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setEditingEntry(entry)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {editingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{timeEntries.editEntry}</h3>
            <form onSubmit={handleUpdateEntry} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {timeEntries.clockInTime}
                </label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={format(new Date(editingEntry.clockIn), "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      clockIn: new Date(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {timeEntries.clockOutTime}
                </label>
                <input
                  type="datetime-local"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={editingEntry.clockOut ? format(new Date(editingEntry.clockOut), "yyyy-MM-dd'T'HH:mm") : ''}
                  onChange={(e) =>
                    setEditingEntry({
                      ...editingEntry,
                      clockOut: e.target.value ? new Date(e.target.value) : null,
                    })
                  }
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};