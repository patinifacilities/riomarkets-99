import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  saldo_moeda: number;
  nivel: 'iniciante' | 'analista' | 'guru' | 'root';
  is_admin: boolean;
  is_blocked?: boolean;
  created_at: string;
  updated_at: string;
  username?: string;
  phone?: string;
  profile_pic_url?: string;
  cpf?: string;
}

export const useProfile = (userId?: string) => {
  const queryClient = useQueryClient();
  
  // Listen for balance updates via events and realtime subscription
  useEffect(() => {
    if (!userId) return;

    // Handle manual refresh events - instant update
    const handleForceRefresh = () => {
      console.log('🔄 Force refresh triggered for profile:', userId);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.refetchQueries({ queryKey: ['profile', userId] });
    };

    window.addEventListener('forceProfileRefresh', handleForceRefresh);
    
    // Subscribe to realtime updates for this user's profile - instant update
    const channel = supabase
      .channel(`profile-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          console.log('💰 Profile balance updated via realtime:', payload);
          // Instant invalidate and refetch when profile is updated
          queryClient.invalidateQueries({ queryKey: ['profile', userId] });
          queryClient.refetchQueries({ queryKey: ['profile', userId] });
        }
      )
      .subscribe();
    
    return () => {
      window.removeEventListener('forceProfileRefresh', handleForceRefresh);
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      return data as Profile | null;
    },
    enabled: !!userId,
  });
};

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('saldo_moeda', { ascending: false });

      if (error) throw error;
      return (data || []) as Profile[];
    },
  });
};