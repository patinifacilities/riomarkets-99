import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Database } from 'lucide-react';
import { Category } from '@/hooks/useCategories';
import { useCategoryValidation } from '@/hooks/useCategoryValidation';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  category: Category | null;
  isLoading: boolean;
}

const DeleteConfirmDialog = ({ isOpen, onClose, onConfirm, category, isLoading }: DeleteConfirmDialogProps) => {
  const { checkDependencies } = useCategoryValidation();
  const [dependencies, setDependencies] = useState<{
    marketsCount: number;
    canDelete: boolean;
  }>({ marketsCount: 0, canDelete: true });
  const [loadingDeps, setLoadingDeps] = useState(false);

  useEffect(() => {
    if (!category || !isOpen) return;

    const loadDependencies = async () => {
      setLoadingDeps(true);
      try {
        const deps = await checkDependencies(category.id);
        setDependencies(deps);
      } catch (error) {
        console.error('Error checking dependencies:', error);
        setDependencies({ marketsCount: 0, canDelete: false });
      } finally {
        setLoadingDeps(false);
      }
    };

    loadDependencies();
  }, [category, isOpen, checkDependencies]);

  if (!category) return null;

  const handleConfirm = () => {
    if (dependencies.canDelete) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Confirmar Exclusão
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>
                Você tem certeza que deseja excluir a categoria{' '}
                <strong>"{category.nome}"</strong>?
              </p>

              {loadingDeps ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm">Verificando dependências...</span>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4" />
                    <span className="text-sm font-medium">Análise de Impacto:</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Mercados vinculados:</span>
                      <Badge variant={dependencies.marketsCount > 0 ? "destructive" : "secondary"}>
                        {dependencies.marketsCount}
                      </Badge>
                    </div>
                  </div>

                  {!dependencies.canDelete && (
                    <div className="mt-3 p-2 rounded bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">
                        <strong>Não é possível excluir esta categoria.</strong>
                        <br />
                        Existem {dependencies.marketsCount} mercado(s) vinculado(s) a ela.
                        Para excluir esta categoria, primeiro remova ou altere a categoria desses mercados.
                      </p>
                    </div>
                  )}

                  {dependencies.canDelete && dependencies.marketsCount === 0 && (
                    <div className="mt-3 p-2 rounded bg-success/10 border border-success/20">
                      <p className="text-sm text-success">
                        Nenhuma dependência encontrada. A categoria pode ser excluída com segurança.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {dependencies.canDelete && (
                <p className="text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !dependencies.canDelete || loadingDeps}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Excluindo...' : 'Excluir Categoria'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteConfirmDialog;