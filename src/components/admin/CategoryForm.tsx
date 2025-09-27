import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCategoryValidation } from '@/hooks/useCategoryValidation';
import { Category } from '@/hooks/useCategories';

const categorySchema = z.object({
  id: z.string()
    .min(1, 'ID é obrigatório')
    .max(50, 'ID deve ter no máximo 50 caracteres')
    .regex(/^[a-z0-9_-]+$/, 'ID deve conter apenas letras minúsculas, números, hífens e underscores'),
  nome: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  icon_url: z.string().url('URL inválida').optional().or(z.literal('')),
  ativo: z.boolean(),
  ordem: z.number().min(0, 'Ordem deve ser maior ou igual a 0').int('Ordem deve ser um número inteiro')
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  initialData?: Category | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  isEditing: boolean;
}

const CategoryForm = ({ initialData, onSubmit, onCancel, isLoading, isEditing }: CategoryFormProps) => {
  const { toast } = useToast();
  const { validateUniqueness } = useCategoryValidation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    setError,
    clearErrors
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      id: initialData?.id || '',
      nome: initialData?.nome || '',
      icon_url: initialData?.icon_url || '',
      ativo: initialData?.ativo ?? true,
      ordem: initialData?.ordem ?? 0
    }
  });

  const watchedId = watch('id');
  const watchedNome = watch('nome');
  const watchedAtivo = watch('ativo');

  // Auto-generate ID from name for new categories
  useEffect(() => {
    if (!isEditing && watchedNome) {
      const autoId = watchedNome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      
      setValue('id', autoId);
    }
  }, [watchedNome, isEditing, setValue]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      // Validate uniqueness
      const validation = await validateUniqueness(
        data.id, 
        data.nome, 
        isEditing ? initialData?.id : undefined
      );

      if (!validation.isIdUnique) {
        setError('id', { message: 'Este ID já está em uso' });
        return;
      }

      if (!validation.isNameUnique) {
        setError('nome', { message: 'Este nome já está em uso' });
        return;
      }

      // Clear any previous errors
      clearErrors();

      // Clean up icon_url
      const cleanData = {
        ...data,
        icon_url: data.icon_url?.trim() || undefined
      };

      await onSubmit(cleanData);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar categoria",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            id="nome"
            {...register('nome')}
            placeholder="Ex: Esportes"
            disabled={isLoading}
          />
          {errors.nome && (
            <p className="text-sm text-destructive">{errors.nome.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="id">ID</Label>
          <Input
            id="id"
            {...register('id')}
            placeholder="Ex: esportes"
            disabled={isLoading || isEditing}
          />
          {errors.id && (
            <p className="text-sm text-destructive">{errors.id.message}</p>
          )}
          {!isEditing && (
            <p className="text-xs text-muted-foreground">
              Gerado automaticamente a partir do nome
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon_url">URL do Ícone (opcional)</Label>
        <Input
          id="icon_url"
          {...register('icon_url')}
          placeholder="https://exemplo.com/icone.svg"
          disabled={isLoading}
        />
        {errors.icon_url && (
          <p className="text-sm text-destructive">{errors.icon_url.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          URL de um ícone SVG ou imagem para representar a categoria
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ordem">Ordem</Label>
          <Input
            id="ordem"
            type="number"
            min="0"
            {...register('ordem', { valueAsNumber: true })}
            disabled={isLoading}
          />
          {errors.ordem && (
            <p className="text-sm text-destructive">{errors.ordem.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={watchedAtivo}
              onCheckedChange={(checked) => setValue('ativo', checked)}
              disabled={isLoading}
            />
            <Label className="text-sm">
              {watchedAtivo ? 'Categoria ativa' : 'Categoria inativa'}
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="shadow-success"
        >
          {isLoading ? 'Salvando...' : (isEditing ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;