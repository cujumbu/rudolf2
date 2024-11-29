import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus } from 'lucide-react';
import { translations } from '../utils/translations';

const { admin: { admins }, common, errors } = translations;

interface AdminManagementProps {
  onAdminCreated: () => void;
}

export const AdminManagement: React.FC<AdminManagementProps> = ({ onAdminCreated }) => {
  const [showNewAdmin, setShowNewAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  });
  const [error, setError] = useState('');

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // First create the auth user with proper metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newAdmin.email,
        password: newAdmin.password,
        options: {
          data: {
            first_name: newAdmin.firstName,
            last_name: newAdmin.lastName,
            role: 'admin'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error(errors.createFailed);

      // Then create the user profile in public.users
      const { error: profileError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email: newAdmin.email,
          first_name: newAdmin.firstName,
          last_name: newAdmin.lastName,
          role: 'admin',
          active: true,
          pin: null
        }]);

      if (profileError) throw profileError;

      setShowNewAdmin(false);
      setNewAdmin({ email: '', firstName: '', lastName: '', password: '' });
      onAdminCreated();
    } catch (err) {
      console.error('Error creating admin:', err);
      setError(err.message || errors.createFailed);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">{admins.management}</h2>
        <button
          onClick={() => setShowNewAdmin(true)}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {admins.addNew}
        </button>
      </div>

      {showNewAdmin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{admins.addNew}</h3>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
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
                  value={newAdmin.email}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {common.firstName}
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={newAdmin.firstName}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, firstName: e.target.value })
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
                  value={newAdmin.lastName}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, lastName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {common.password}
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  value={newAdmin.password}
                  onChange={(e) =>
                    setNewAdmin({ ...newAdmin, password: e.target.value })
                  }
                />
                <p className="mt-1 text-sm text-gray-500">
                  Minimum 8 tegn
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewAdmin(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                >
                  {common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  {admins.createAdmin}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};