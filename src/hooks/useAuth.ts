import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialSessionChecked = false;

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        // Only log for actual auth events, not initial session
        if (event !== 'INITIAL_SESSION') {
          console.log('Auth state changed:', event, session ? 'User logged in' : 'User logged out');
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        initialSessionChecked = true;
      }
    );

    // Get initial session only if listener hasn't handled it yet
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && !initialSessionChecked) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!session && !!user
  };
};