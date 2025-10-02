import { useState } from 'react';
import { Plus, Search, Settings, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useCategoriesAdmin } from '@/hooks/useCategoriesAdmin';
import { useCategoryMutations } from '@/hooks/useCategoryMutations';
import CategoriesTable from '@/components/admin/CategoriesTable';
import CategoryModal from '@/components/admin/CategoryModal';
import DeleteConfirmDialog from '@/components/admin/DeleteConfirmDialog';
import { Category } from '@/hooks/useCategories';
import { useNavigate } from 'react-router-dom';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const AdminCategories = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data: categories = [], isLoading, refetch } = useCategoriesAdmin();
  const { deleteCategory, reorderCategories } = useCategoryMutations();

  const filteredCategories = categories.filter(category =>
    category.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    refetch();
    toast({
      title: "Categoria criada!",
      description: "A categoria foi criada com sucesso.",
    });
  };

  const handleEditSuccess = () => {
    setEditingCategory(null);
    refetch();
    toast({
      title: "Categoria atualizada!",
      description: "A categoria foi atualizada com sucesso.",
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    
    try {
      await deleteCategory.mutateAsync(deletingCategory.id);
      setDeletingCategory(null);
      refetch();
      toast({
        title: "Categoria excluída!",
        description: "A categoria foi excluída com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Não foi possível excluir a categoria.",
        variant: "destructive"
      });
    }
  };

  const handleReorder = async (reorderedCategories: Category[]) => {
    try {
      await reorderCategories.mutateAsync(reorderedCategories);
      refetch();
      toast({
        title: "Ordem atualizada!",
        description: "A ordem das categorias foi atualizada.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ordem.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar isOpen={false} onToggle={() => {}} />
      
      <div className="flex-1 lg:ml-0">
        {/* Hide on mobile */}
        <div className="hidden md:block container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Settings className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Gerenciar Categorias</h1>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="gap-2 shadow-success"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-2 bg-card-secondary border-border-secondary">
            <CardContent className="p-6">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card-secondary border-border-secondary">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Total de Categorias</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {categories.filter(c => c.ativo).length} ativas
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Categories Table */}
        <Card className="bg-card-secondary border-border-secondary">
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <CategoriesTable
                categories={filteredCategories}
                onEdit={setEditingCategory}
                onDelete={setDeletingCategory}
                onReorder={handleReorder}
                onRefetch={refetch}
              />
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <CategoryModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

        {/* Edit Modal */}
        <CategoryModal
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={handleEditSuccess}
          category={editingCategory}
        />

        {/* Delete Confirmation */}
        <DeleteConfirmDialog
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleDeleteConfirm}
          category={deletingCategory}
          isLoading={deleteCategory.isPending}
        />
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;