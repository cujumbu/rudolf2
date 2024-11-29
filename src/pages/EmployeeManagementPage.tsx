import React from 'react';
import { AdminManagement } from '../components/AdminManagement';
import { EmployeeManagement } from '../components/EmployeeManagement';
import { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { translations } from '../utils/translations';
import { Trash2 } from 'lucide-react';

const { admin: { admins }, errors, common } = translations;

export const EmployeeManagementPage: React.FC = () => {
  const [employees, setEmployees] = useState<User[]>([]);
  const [administrators, setAdministrators] = useState<User[]>([]);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const fetchUsers = async () => {
    try {
      // Fetch employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'employee');
      
      if (employeeError) throw employeeError;

      // Fetch administrators
      const { data: adminData, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin');
      
      if (adminError) throw adminError;

      if (employeeData) {
        const formattedEmployees: User[] = employeeData.map(emp => ({
          id: emp.id,
          email: emp.email,
          firstName: emp.first_name,
          lastName: emp.last_name,
          pin: emp.pin,
          role: emp.role,
          active: emp.active
        }));
        setEmployees(formattedEmployees);
      }

      if (adminData) {
        const formattedAdmins: User[] = adminData.map(admin => ({
          id: admin.id,
          email: admin.email,
          firstName: admin.first_name,
          lastName: admin.last_name,
          pin: admin.pin,
          role: admin.role,
          active: admin.active
        }));
        setAdministrators(formattedAdmins);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(errors.failedToLoad);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    try {
      setDeleteError('');

      // First delete from public.users
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .eq('id', adminId);
      
      if (userError) throw userError;

      // Refresh the users list
      await fetchUsers();
    } catch (err) {
      console.error('Error deleting administrator:', err);
      setDeleteError(errors.deleteFailed);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      <AdminManagement onAdminCreated={fetchUsers} />
      
      {/* Administrators List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">{admins.currentAdmins}</h2>
        {deleteError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {deleteError}
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
                  {common.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {common.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {administrators.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {admin.firstName} {admin.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {admin.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        admin.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {admin.active ? common.active : common.inactive}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title={common.delete}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <EmployeeManagement 
        employees={employees}
        onUpdate={fetchUsers}
      />
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}
    </div>
  );
};