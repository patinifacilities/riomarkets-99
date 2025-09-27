import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  nome: string;
  email: string;
  saldo_moeda: number;
  nivel: string;
  is_admin: boolean;
  created_at: string;
}

export const useProfiles = () => {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Profile[];
    },
  });
};

export const useProfile = (id: string | undefined) => {
  return useQuery({
    queryKey: ['profile', id],
    queryFn: async (): Promise<Profile | null> => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) return null;
      return data as Profile;
    },
    enabled: !!id,
  });
};