import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useCategoryValidation = () => {
  const validateUniqueness = useCallback(async (
    id: string, 
    nome: string, 
    excludeId?: string
  ): Promise<{
    isIdUnique: boolean;
    isNameUnique: boolean;
  }> => {
    // Check ID uniqueness
    let idQuery = supabase
      .from('categories')
      .select('id')
      .eq('id', id);

    if (excludeId) {
      idQuery = idQuery.neq('id', excludeId);
    }

    const { data: idData, error: idError } = await idQuery.limit(1);
    
    if (idError) throw idError;

    // Check name uniqueness
    let nameQuery = supabase
      .from('categories')
      .select('id')
      .eq('nome', nome);

    if (excludeId) {
      nameQuery = nameQuery.neq('id', excludeId);
    }

    const { data: nameData, error: nameError } = await nameQuery.limit(1);
    
    if (nameError) throw nameError;

    return {
      isIdUnique: !idData || idData.length === 0,
      isNameUnique: !nameData || nameData.length === 0
    };
  }, []);

  const checkDependencies = useCallback(async (categoryId: string): Promise<{
    marketsCount: number;
    canDelete: boolean;
  }> => {
    // Check how many markets use this category
    const { data: markets, error } = await supabase
      .from('markets')
      .select('id')
      .eq('categoria', categoryId);

    if (error) throw error;

    const marketsCount = markets?.length || 0;

    return {
      marketsCount,
      canDelete: marketsCount === 0
    };
  }, []);

  return {
    validateUniqueness,
    checkDependencies
  };
};