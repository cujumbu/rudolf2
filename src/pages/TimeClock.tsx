import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStationStore } from '../stores/stationStore';
import { useAuthStore } from '../stores/authStore';
import { User } from '../types';
import { Clock, ShieldAlert, Snowflake } from 'lucide-react';
import { ActiveEmployeesSidebar } from '../components/ActiveEmployeesSidebar';
import { translations } from '../utils/translations';
import { useNavigate } from 'react-router-dom';

const { timeClock, errors } = translations;

export const TimeClock: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { station, authorized, loading, authorizeStation, deauthorizeStation } = useStationStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [currentEmployee, setCurrentEmployee] = useState<User | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastEntry, setLastEntry] = useState<{ clockIn: Date; clockOut: Date | null } | null>(null);

  const handleReset = () => {
    setPin('');
    setCurrentEmployee(null);
    setLastEntry(null);
    setError('');
  };

  const fetchLastEntry = async (userId: string) => {
    const { data } = await supabase
      .from('time_entries')
      .select('*')
      .eq('user_id', userId)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setLastEntry({
        clockIn: new Date(data.clock_in),
        clockOut: data.clock_out ? new Date(data.clock_out) : null,
      });
    } else {
      setLastEntry(null);
    }
  };

  const handleClockAction = async () => {
    if (!currentEmployee || !station) {
      setError(errors.systemError);
      return;
    }

    try {
      if (!lastEntry) {
        // Clock In
        const { error: clockInError } = await supabase
          .from('time_entries')
          .insert([{
            user_id: currentEmployee.id,
            clock_in: new Date().toISOString(),
            clock_out: null,
            station_id: station.id
          }]);

        if (clockInError) throw clockInError;
      } else {
        // Clock Out
        const { error: clockOutError } = await supabase
          .from('time_entries')
          .update({ 
            clock_out: new Date().toISOString()
          })
          .eq('user_id', currentEmployee.id)
          .is('clock_out', null);

        if (clockOutError) throw clockOutError;
      }

      await fetchLastEntry(currentEmployee.id);
      handleReset();
    } catch (error) {
      console.error('Clock action error:', error);
      setError(errors.systemError);
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!station) {
      setError(errors.systemError);
      return;
    }

    const { data: employee, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('pin', pin)
      .eq('role', 'employee')
      .eq('active', true)
      .single();

    if (fetchError || !employee) {
      setError('Ugyldig PIN-kode');
      return;
    }

    const formattedEmployee: User = {
      id: employee.id,
      email: employee.email,
      firstName: employee.first_name,
      lastName: employee.last_name,
      pin: employee.pin,
      role: employee.role,
      active: employee.active
    };

    setCurrentEmployee(formattedEmployee);
    await fetchLastEntry(formattedEmployee.id);
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    useStationStore.getState().checkAuthorization();
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!authorized) {
      handleReset();
    }
  }, [authorized]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D42D27]" />
      </div>
    );
  }

  if (!authorized && user?.role === 'admin') {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-[#D42D27]" />
          <h2 className="mt-2 text-lg font-medium text-[#2F4538]">{timeClock.stationNotAuthorized}</h2>
          <p className="mt-1 text-sm text-[#4A6FA5]">{timeClock.stationNeedsAuth}</p>
          <button
            onClick={() => authorizeStation(user.id)}
            className="mt-4 btn-primary"
          >
            {timeClock.authorizeStation}
          </button>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-[#D42D27]" />
          <h2 className="mt-2 text-lg font-medium text-[#2F4538]">{timeClock.stationNotAuthorized}</h2>
          <p className="mt-1 text-sm text-[#4A6FA5]">{timeClock.stationNeedsAuth}</p>
          <button
            onClick={() => navigate('/login')}
            className="mt-4 btn-primary"
          >
            {translations.auth.signIn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Snowflake className="mx-auto h-16 w-16 text-[#D42D27]" />
            <h2 className="mt-6 text-3xl font-bold text-[#2F4538]">
              {currentEmployee ? `${timeClock.welcome}, ${currentEmployee.firstName}!` : timeClock.title}
            </h2>
            <p className="mt-2 text-lg font-medium text-[#4A6FA5]">
              Rudolf.dk
            </p>
            <p className="mt-2 text-sm text-[#4A6FA5]">
              {currentTime.toLocaleTimeString()}
            </p>
            <p className="mt-1 text-xs text-[#4A6FA5]">
              Station: {station?.name}
            </p>
          </div>

          {!currentEmployee ? (
            <form onSubmit={handlePinSubmit} className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="pin" className="sr-only">
                  {timeClock.enterPin}
                </label>
                <input
                  id="pin"
                  type="password"
                  required
                  className="input-primary"
                  placeholder={timeClock.enterPin}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                {timeClock.enterPin}
              </button>
            </form>
          ) : (
            <div className="mt-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              <button
                onClick={handleClockAction}
                className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                  lastEntry
                    ? 'bg-[#D42D27] hover:bg-[#B82520]'
                    : 'bg-[#2F4538] hover:bg-[#243729]'
                }`}
              >
                {lastEntry ? timeClock.clockOut : timeClock.clockIn}
              </button>
              <button
                onClick={handleReset}
                className="w-full py-2 px-4 text-[#4A6FA5] hover:text-[#3D5C8C]"
              >
                {timeClock.switchUser}
              </button>
            </div>
          )}

          {user?.role === 'admin' && (
            <button
              onClick={deauthorizeStation}
              className="mt-4 text-sm text-[#D42D27] hover:text-[#B82520]"
            >
              {timeClock.deauthorizeStation}
            </button>
          )}
        </div>
      </div>
      <ActiveEmployeesSidebar />
    </div>
  );
};