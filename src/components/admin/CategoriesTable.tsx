import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Edit, Trash2, Eye, EyeOff, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useCategoryMutations } from '@/hooks/useCategoryMutations';
import { Category } from '@/hooks/useCategories';

interface CategoriesTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onReorder: (categories: Category[]) => void;
  onRefetch: () => void;
}

const CategoriesTable = ({ categories, onEdit, onDelete, onReorder, onRefetch }: CategoriesTableProps) => {
  const { toast } = useToast();
  const { toggleActive } = useCategoryMutations();
  const [draggedCategories, setDraggedCategories] = useState(categories);

  // Update local state when categories prop changes
  React.useEffect(() => {
    setDraggedCategories(categories);
  }, [categories]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(draggedCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update ordem based on new positions
    const reorderedWithNewOrder = items.map((item, index) => ({
      ...item,
      ordem: index
    }));

    setDraggedCategories(reorderedWithNewOrder);
    onReorder(reorderedWithNewOrder);
  };

  const handleToggleActive = async (category: Category) => {
    try {
      await toggleActive.mutateAsync({
        id: category.id,
        ativo: !category.ativo
      });
      onRefetch();
      toast({
        title: category.ativo ? "Categoria desativada" : "Categoria ativada",
        description: `"${category.nome}" foi ${category.ativo ? 'desativada' : 'ativada'}.`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status da categoria.",
        variant: "destructive"
      });
    }
  };

  const IconPreview = ({ iconUrl, nome }: { iconUrl?: string; nome: string }) => {
    if (!iconUrl) {
      return (
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
          <Image className="w-4 h-4 text-muted-foreground" />
        </div>
      );
    }

    return (
      <div className="w-8 h-8 rounded overflow-hidden bg-muted flex items-center justify-center">
        <img 
          src={iconUrl} 
          alt={nome}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <Image className="w-4 h-4 text-muted-foreground hidden" />
      </div>
    );
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhuma categoria encontrada.</p>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="categories">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {draggedCategories.map((category, index) => (
              <Draggable key={category.id} draggableId={category.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`
                      p-4 rounded-lg border border-border bg-card transition-colors
                      ${snapshot.isDragging ? 'shadow-lg bg-card/80' : ''}
                    `}
                  >
                    <div className="flex items-center gap-4">
                      {/* Drag Handle */}
                      <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5 text-muted-foreground" />
                      </div>

                      {/* Order */}
                      <div className="w-8 text-center">
                        <Badge variant="outline" className="text-xs">
                          {category.ordem}
                        </Badge>
                      </div>

                      {/* Icon */}
                      <IconPreview iconUrl={category.icon_url} nome={category.nome} />

                      {/* Name and ID */}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{category.nome}</div>
                        <div className="text-sm text-muted-foreground truncate">ID: {category.id}</div>
                      </div>

                      {/* Active Status */}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={category.ativo}
                          onCheckedChange={() => handleToggleActive(category)}
                          disabled={toggleActive.isPending}
                        />
                        <Badge 
                          variant={category.ativo ? "default" : "secondary"}
                          className="gap-1"
                        >
                          {category.ativo ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Ativa
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Inativa
                            </>
                          )}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(category)}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(category)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default CategoriesTable;