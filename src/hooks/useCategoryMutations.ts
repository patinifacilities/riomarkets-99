import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Category } from './useCategories';

interface CreateCategoryData {
  id: string;
  nome: string;
  icon_url?: string;
  ativo: boolean;
  ordem: number;
}

interface UpdateCategoryData extends CreateCategoryData {
  originalId: string;
}

interface ToggleActiveData {
  id: string;
  ativo: boolean;
}

export const useCategoryMutations = () => {
  const createCategory = useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      const { error } = await supabase
        .from('categories')
        .insert({
          id: data.id,
          nome: data.nome,
          icon_url: data.icon_url || null,
          ativo: data.ativo,
          ordem: data.ordem
        });

      if (error) throw error;
    }
  });

  const updateCategory = useMutation({
    mutationFn: async (data: UpdateCategoryData) => {
      const { error } = await supabase
        .from('categories')
        .update({
          nome: data.nome,
          icon_url: data.icon_url || null,
          ativo: data.ativo,
          ordem: data.ordem
        })
        .eq('id', data.originalId);

      if (error) throw error;
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      // First check if there are any markets using this category
      const { data: markets, error: checkError } = await supabase
        .from('markets')
        .select('id')
        .eq('categoria', id)
        .limit(1);

      if (checkError) throw checkError;

      if (markets && markets.length > 0) {
        throw new Error('Não é possível excluir esta categoria pois existem mercados vinculados a ela.');
      }

      // If no markets found, proceed with deletion
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  });

  const toggleActive = useMutation({
    mutationFn: async (data: ToggleActiveData) => {
      const { error } = await supabase
        .from('categories')
        .update({ ativo: data.ativo })
        .eq('id', data.id);

      if (error) throw error;
    }
  });

  const reorderCategories = useMutation({
    mutationFn: async (categories: Category[]) => {
      // Update all categories with their new ordem values
      const updates = categories.map((category, index) => ({
        id: category.id,
        ordem: index
      }));

      // Perform batch update
      for (const update of updates) {
        const { error } = await supabase
          .from('categories')
          .update({ ordem: update.ordem })
          .eq('id', update.id);

        if (error) throw error;
      }
    }
  });

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
    reorderCategories
  };
};