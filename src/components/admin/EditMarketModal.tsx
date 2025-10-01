import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Market } from '@/types';
import { useCategories } from '@/hooks/useCategories';

interface EditMarketModalProps {
  market: Market | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EditMarketModal = ({ market, isOpen, onClose, onSuccess }: EditMarketModalProps) => {
  const { toast } = useToast();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [editMarket, setEditMarket] = useState({
    title: '',
    description: '',
    category: '',
    endDate: '',
    destaque: false,
    periodicidade: '',
    iconUrl: '',
    photoUrl: ''
  });
  const [editingOptions, setEditingOptions] = useState<string[]>([]);

  useEffect(() => {
    if (market) {
      setEditMarket({
        title: market.titulo || '',
        description: market.descricao || '',
        category: market.categoria || '',
        endDate: market.end_date ? new Date(market.end_date).toISOString().slice(0, 16) : '',
        destaque: market.destaque || false,
        periodicidade: market.periodicidade || '',
        iconUrl: market.icon_url || '',
        photoUrl: market.photo_url || ''
      });
      setEditingOptions([...(market.opcoes || [])]);
    }
  }, [market]);

  const handleUpdateMarket = async () => {
    if (!market) return;

    if (!editMarket.title || !editMarket.description || !editMarket.category || !editMarket.endDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Updating market with data:', {
        titulo: editMarket.title,
        descricao: editMarket.description,
        categoria: editMarket.category,
        end_date: new Date(editMarket.endDate).toISOString(),
        destaque: editMarket.destaque,
        periodicidade: editMarket.periodicidade || null
      });

      const { data, error } = await supabase
        .from('markets')
        .update({
          titulo: editMarket.title,
          descricao: editMarket.description,
          categoria: editMarket.category,
          end_date: new Date(editMarket.endDate).toISOString(),
          destaque: editMarket.destaque,
          periodicidade: editMarket.periodicidade || null,
          opcoes: editingOptions,
          icon_url: editMarket.iconUrl || null,
          photo_url: editMarket.photoUrl || null
        })
        .eq('id', market.id)
        .select();

      console.log('Update result:', { data, error });

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      toast({
        title: "Mercado atualizado com sucesso!",
        description: `"${editMarket.title}" foi atualizado`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating market:', error);
      toast({
        title: "Erro ao atualizar mercado",
        description: error.message || "Falha ao atualizar mercado. Verifique suas permissões.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!market) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Mercado</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Título</label>
              <Input
                placeholder="Ex: Bitcoin atingirá $100k?"
                value={editMarket.title}
                onChange={(e) => setEditMarket({...editMarket, title: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select 
                value={editMarket.category} 
                onValueChange={(value) => setEditMarket({...editMarket, category: value})}
                disabled={categoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Descrição</label>
            <Textarea
              placeholder="Descreva detalhadamente o mercado..."
              value={editMarket.description}
              onChange={(e) => setEditMarket({...editMarket, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Data de Encerramento</label>
              <Input
                type="datetime-local"
                value={editMarket.endDate}
                onChange={(e) => setEditMarket({...editMarket, endDate: e.target.value})}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Periodicidade</label>
              <Select 
                value={editMarket.periodicidade} 
                onValueChange={(value) => setEditMarket({...editMarket, periodicidade: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a periodicidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unico">Único</SelectItem>
                  <SelectItem value="diario">Diário</SelectItem>
                  <SelectItem value="semanal">Semanal</SelectItem>
                  <SelectItem value="mensal">Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">URL do Ícone do Pool</label>
              <Input
                type="url"
                placeholder="https://example.com/icon.png"
                value={editMarket.iconUrl}
                onChange={(e) => setEditMarket({...editMarket, iconUrl: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: imagem quadrada pequena (ex: 64x64px)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">URL da Foto do Pool</label>
              <Input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={editMarket.photoUrl}
                onChange={(e) => setEditMarket({...editMarket, photoUrl: e.target.value})}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recomendado: imagem em formato 21:9 (ex: 1920x823px)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="destaque"
              checked={editMarket.destaque}
              onChange={(e) => setEditMarket({...editMarket, destaque: e.target.checked})}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="destaque" className="text-sm font-medium">
              Mercado em destaque
            </label>
          </div>

          {/* Editable market options */}
          <div className="space-y-2">
            <label className="text-sm font-medium mb-2 block">Opções do Mercado</label>
            <div className="space-y-2">
              {editingOptions.map((opcao, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={opcao}
                    onChange={(e) => {
                      const newOptions = [...editingOptions];
                      newOptions[index] = e.target.value;
                      setEditingOptions(newOptions);
                    }}
                    placeholder={`Opção ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newOptions = editingOptions.filter((_, i) => i !== index);
                      setEditingOptions(newOptions);
                    }}
                    disabled={editingOptions.length <= 2}
                  >
                    Remover
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditingOptions([...editingOptions, ''])}
                disabled={editingOptions.length >= 4}
              >
                Adicionar Opção
              </Button>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              <strong>Tipo:</strong> {market.market_type === 'binary' ? 'Binário (2 opções)' :
                                       market.market_type === 'three_way' ? 'Three-way (3 opções)' :
                                       market.market_type === 'multi' ? `Multi (${market.opcoes.length} opções)` :
                                       `${market.opcoes.length} opções`}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>Status:</strong> {market.status}
            </p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateMarket}
            disabled={isLoading}
            className="shadow-success"
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditMarketModal;