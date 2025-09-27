import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from './useCategories';

export const useCategoriesAdmin = () => {
  return useQuery<Category[]>({
    queryKey: ['categories-admin'],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('ordem', { ascending: true })
        .order('nome', { ascending: true });

      if (error) {
        throw error;
      }
      
      return data || [];
    },
  });
};