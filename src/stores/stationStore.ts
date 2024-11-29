import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Station } from '../types';

interface StationState {
  station: Station | null;
  authorized: boolean;
  loading: boolean;
  authorizeStation: (adminId: string) => Promise<void>;
  deauthorizeStation: () => void;
  checkAuthorization: () => Promise<void>;
}

export const useStationStore = create<StationState>((set) => ({
  station: null,
  authorized: false,
  loading: true,
  authorizeStation: async (adminId: string) => {
    try {
      const { data: station } = await supabase
        .from('stations')
        .select('*')
        .eq('is_active', true)
        .single();

      if (station) {
        // Store authorization in sessionStorage instead of localStorage
        // This ensures it persists during the browser session but clears on tab close
        const authorization = {
          stationId: station.id,
          adminId,
          timestamp: new Date().toISOString(),
        };
        sessionStorage.setItem('station_auth', JSON.stringify(authorization));
        
        const formattedStation: Station = {
          id: station.id,
          name: station.name,
          location: station.location,
          deviceId: station.device_id,
          isActive: station.is_active,
        };
        
        set({ station: formattedStation, authorized: true });
      }
    } catch (error) {
      console.error('Station authorization error:', error);
      set({ station: null, authorized: false });
    }
  },
  deauthorizeStation: () => {
    sessionStorage.removeItem('station_auth');
    set({ authorized: false, station: null });
  },
  checkAuthorization: async () => {
    try {
      const auth = sessionStorage.getItem('station_auth');
      if (!auth) {
        set({ authorized: false, loading: false });
        return;
      }

      const { stationId, timestamp } = JSON.parse(auth);
      
      // Check if the authorization is from the current session
      const authTime = new Date(timestamp);
      const now = new Date();
      const hoursSinceAuth = (now.getTime() - authTime.getTime()) / (1000 * 60 * 60);
      
      // If authorization is older than 12 hours, clear it
      if (hoursSinceAuth > 12) {
        sessionStorage.removeItem('station_auth');
        set({ authorized: false, loading: false });
        return;
      }

      const { data: station } = await supabase
        .from('stations')
        .select('*')
        .eq('id', stationId)
        .eq('is_active', true)
        .single();

      if (!station) {
        sessionStorage.removeItem('station_auth');
        set({ authorized: false, loading: false });
        return;
      }

      const formattedStation: Station = {
        id: station.id,
        name: station.name,
        location: station.location,
        deviceId: station.device_id,
        isActive: station.is_active,
      };

      set({ 
        station: formattedStation,
        authorized: true,
        loading: false
      });
    } catch (error) {
      console.error('Station authorization check error:', error);
      sessionStorage.removeItem('station_auth');
      set({ authorized: false, loading: false });
    }
  },
}));