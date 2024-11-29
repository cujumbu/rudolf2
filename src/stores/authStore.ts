import { create } from 'zustand';
import { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  initializeAuth: async () => {
    try {
      // Clear any stale data first
      set({ user: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (!session) {
        set({ loading: false });
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (userError || !userData) {
        // If no user data found or error, clear the session
        await supabase.auth.signOut();
        set({ loading: false });
        return;
      }

      const formattedUser: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        pin: userData.pin,
        role: userData.role,
        active: userData.active
      };
      
      set({ user: formattedUser });
    } catch (error) {
      console.error('Auth initialization error:', error);
      // On error, ensure we're in a clean state
      await supabase.auth.signOut();
    } finally {
      set({ loading: false });
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        set({ user: null });
        return;
      }

      if (session?.user) {
        try {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (userError || !userData) {
            set({ user: null });
            return;
          }

          const formattedUser: User = {
            id: userData.id,
            email: userData.email,
            firstName: userData.first_name,
            lastName: userData.last_name,
            pin: userData.pin,
            role: userData.role,
            active: userData.active
          };
          set({ user: formattedUser });
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ user: null });
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  },
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (!data.user) {
        throw new Error('No user data returned after sign in');
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError || !userData) {
        throw new Error('Failed to fetch user data');
      }

      const formattedUser: User = {
        id: userData.id,
        email: userData.email,
        firstName: userData.first_name,
        lastName: userData.last_name,
        pin: userData.pin,
        role: userData.role,
        active: userData.active
      };
      set({ user: formattedUser });
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },
  signOut: async () => {
    try {
      // First clear all local storage
      localStorage.clear();
      
      // Clear the auth session from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear the local state
      set({ user: null });
      
      // Force a page reload to clear any cached state
      window.location.href = '/clock';
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, ensure local state is cleared
      localStorage.clear();
      set({ user: null });
      window.location.href = '/clock';
    }
  },
}));