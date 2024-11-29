import React, { useState } from 'react';
import { User } from '../types';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { translations } from '../utils/translations';
import { NewEmployeeForm } from './NewEmployeeForm';

const { admin: { employees }, common, errors } = translations;

interface EmployeeManagementProps {
  employees: User[];
  onUpdate: () => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ 
  employees: employeeList, 
  onUpdate 
}) => {
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
  const [error, setError] = useState('');

  const togglePin = (employeeId: string) => {
    setShowPins(prev => ({
      ...prev,
      [employeeId]: !prev[employeeId]
    }));
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: editingEmployee.firstName,
          last_name: editingEmployee.lastName,
          pin: editingEmployee.pin,
          active: editingEmployee.active
        })
        .eq('id', editingEmployee.id);

      if (updateError) throw updateError;

      setEditingEmployee(null);
      onUpdate();
    } catch (err) {
      console.error('Error updating employee:', err);
      setError(err.message || errors.updateFailed);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{employees.details}</h2>
        <NewEmployeeForm onEmployeeCreated={onUpdate} />
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
                {common.email}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {common.pin}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {common.status}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {common.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {employeeList.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.firstName} {employee.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">
                      {showPins[employee.id] ? employee.pin : '****'}
                    </span>
                    <button
                      onClick={() => togglePin(employee.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPins[employee.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      employee.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {employee.active ? common.active : common.inactive}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button
                    onClick={() => setEditingEmployee(employee)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{employees.editEmployee}</h3>
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {common.firstName}
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={editingEmployee.firstName}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {common.lastName}
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={editingEmployee.lastName}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      lastName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {common.pin}
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{4}"
                  title="4-digit PIN code"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={editingEmployee.pin}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      pin: e.target.value.replace(/\D/g, '').slice(0, 4),
                    })
                  }
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  className="rounded border-gray-300 text-blue-600"
                  checked={editingEmployee.active}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      active: e.target.checked,
                    })
                  }
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  {common.active}
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingEmployee(null)}
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