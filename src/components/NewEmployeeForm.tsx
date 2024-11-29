import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus } from 'lucide-react';
import { translations } from '../utils/translations';

const { admin: { employees }, common, errors } = translations;

interface NewEmployeeFormProps {
  onEmployeeCreated: () => void;
}

export const NewEmployeeForm: React.FC<NewEmployeeFormProps> = ({ onEmployeeCreated }) => {
  const [showNewEmployee, setShowNewEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: '',
    firstName: '',
    lastName: '',
    pin: '',
  });
  const [error, setError] = useState('');

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newEmployee.pin.length !== 4 || !/^\d+$/.test(newEmployee.pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    try {
      const { error: createError } = await supabase
        .from('users')
        .insert([{
          email: newEmployee.email,
          first_name: newEmployee.firstName,
          last_name: newEmployee.lastName,
          pin: newEmployee.pin,
          role: 'employee',
          active: true,
        }]);

      if (createError) throw createError;

      setShowNewEmployee(false);
      setNewEmployee({ email: '', firstName: '', lastName: '', pin: '' });
      onEmployeeCreated();
    } catch (err) {
      console.error('Error creating employee:', err);
      setError(err.message || errors.createFailed);
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={() => setShowNewEmployee(true)}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        {employees.addNew}
      </button>

      {showNewEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{employees.addNew}</h3>
            <form onSubmit={handleCreateEmployee} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {common.email}
                </label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={newEmployee.email}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, email: e.target.value })
                  }
                />
                <p className="mt-1 text-sm text-gray-500">
                  For future notifications
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {common.firstName}
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={newEmployee.firstName}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, firstName: e.target.value })
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
                  value={newEmployee.lastName}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, lastName: e.target.value })
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
                  maxLength={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={newEmployee.pin}
                  onChange={(e) =>
                    setNewEmployee({ ...newEmployee, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })
                  }
                  placeholder="4-digit PIN"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Used for clock in/out
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewEmployee(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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