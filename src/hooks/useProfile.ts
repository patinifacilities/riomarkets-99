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
  created_at: string;
  updated_at: string;
  username?: string;
  phone?: string;
  profile_pic_url?: string;
  cpf?: string;
}

export const useProfile = (userId?: string) => {
  const queryClient = useQueryClient();
  
  // Listen for balance updates
  // Remover event listeners que causam loop infinito
  useEffect(() => {
    // Apenas invalidar quando necessário, sem loops
    const handleForceRefresh = () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['profile', userId] });
        queryClient.refetchQueries({ queryKey: ['profile', userId] });
      }
    };

    window.addEventListener('forceProfileRefresh', handleForceRefresh);
    
    return () => {
      window.removeEventListener('forceProfileRefresh', handleForceRefresh);
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