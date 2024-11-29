import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';
import { format } from 'date-fns';
import { Users } from 'lucide-react';
import { translations } from '../utils/translations';

const { timeClock, common } = translations;

interface ActiveEmployee {
  user: User;
  clockInTime: Date;
}

export const ActiveEmployeesSidebar: React.FC = () => {
  const [activeEmployees, setActiveEmployees] = useState<ActiveEmployee[]>([]);

  const fetchActiveEmployees = async () => {
    const { data: entries, error } = await supabase
      .from('time_entries')
      .select(`
        *,
        users:user_id (*)
      `)
      .is('clock_out', null)
      .order('clock_in', { ascending: false });

    if (!error && entries) {
      const formatted = entries.map(entry => ({
        user: {
          id: entry.users.id,
          email: entry.users.email,
          firstName: entry.users.first_name,
          lastName: entry.users.last_name,
          pin: entry.users.pin,
          role: entry.users.role,
          active: entry.users.active
        },
        clockInTime: new Date(entry.clock_in)
      }));
      setActiveEmployees(formatted);
    }
  };

  useEffect(() => {
    fetchActiveEmployees();
    
    const channel = supabase
      .channel('time_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'time_entries'
        },
        () => {
          fetchActiveEmployees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="fixed right-0 top-0 h-full w-64 bg-white shadow-lg border-l border-[#E8ECF3] p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="h-5 w-5 text-[#D42D27]" />
        <h2 className="text-lg font-semibold text-[#2F4538]">{timeClock.currentlyWorking}</h2>
      </div>
      
      <div className="space-y-4">
        {activeEmployees.length === 0 ? (
          <p className="text-sm text-[#4A6FA5]">{timeClock.noEmployeesClocked}</p>
        ) : (
          activeEmployees.map(({ user, clockInTime }) => (
            <div
              key={user.id}
              className="bg-[#F8F9FC] rounded-lg p-3 space-y-1 border border-[#E8ECF3]"
            >
              <p className="font-medium text-[#2F4538]">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-[#4A6FA5]">
                {common.since} {format(clockInTime, 'HH:mm')}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};