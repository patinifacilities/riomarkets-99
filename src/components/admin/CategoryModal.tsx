import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Category } from '@/hooks/useCategories';
import CategoryForm from './CategoryForm';
import { useCategoryMutations } from '@/hooks/useCategoryMutations';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category?: Category | null;
}

const CategoryModal = ({ isOpen, onClose, onSuccess, category }: CategoryModalProps) => {
  const { createCategory, updateCategory } = useCategoryMutations();
  const [isLoading, setIsLoading] = useState(false);

  const isEditing = !!category;

  const handleSubmit = async (data: {
    id: string;
    nome: string;
    icon_url?: string;
    ativo: boolean;
    ordem: number;
  }) => {
    setIsLoading(true);
    
    try {
      if (isEditing) {
        await updateCategory.mutateAsync({
          ...data,
          originalId: category.id
        });
      } else {
        await createCategory.mutateAsync(data);
      }
      
      onSuccess();
    } catch (error) {
      // Error handling is done in the form component
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>
        
        <CategoryForm
          initialData={category}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          isLoading={isLoading}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;