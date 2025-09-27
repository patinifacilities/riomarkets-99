import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MarketType } from '@/types';
import { useCategories } from '@/hooks/useCategories';

interface CreateMarketFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateMarketForm = ({ onSuccess, onCancel }: CreateMarketFormProps) => {
  const { toast } = useToast();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [newMarket, setNewMarket] = useState({
    title: '',
    description: '',
    category: '',
    endDate: '',
    marketType: 'binary' as MarketType,
    customOptions: ['sim', 'não']
  });

  const marketTypeTemplates = {
    binary: { options: ['sim', 'não'], label: 'Binário (Sim/Não)' },
    three_way: { options: ['sim', 'não', 'empate'], label: 'Três Opções (Sim/Não/Empate)' },
    multi: { options: ['Opção 1', 'Opção 2', 'Opção 3', 'Opção 4'], label: 'Múltiplas Opções (4+)' }
  };

  const handleMarketTypeChange = (type: MarketType) => {
    setNewMarket(prev => ({
      ...prev,
      marketType: type,
      customOptions: [...marketTypeTemplates[type].options]
    }));
  };

  const handleAddOption = () => {
    setNewMarket(prev => ({
      ...prev,
      customOptions: [...prev.customOptions, '']
    }));
  };

  const handleRemoveOption = (index: number) => {
    setNewMarket(prev => ({
      ...prev,
      customOptions: prev.customOptions.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setNewMarket(prev => ({
      ...prev,
      customOptions: prev.customOptions.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleCreateMarket = async () => {
    if (!newMarket.title || !newMarket.description || !newMarket.category || !newMarket.endDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const validOptions = newMarket.customOptions.filter(opt => opt.trim() !== '');
    
    // Validate option count based on market type
    if (newMarket.marketType === 'binary' && validOptions.length !== 2) {
      toast({
        title: "Erro",
        description: "Mercados binários devem ter exatamente 2 opções",
        variant: "destructive"
      });
      return;
    }
    
    if (newMarket.marketType === 'three_way' && validOptions.length !== 3) {
      toast({
        title: "Erro", 
        description: "Mercados 1X2 devem ter exatamente 3 opções",
        variant: "destructive"
      });
      return;
    }
    
    if (newMarket.marketType === 'multi' && validOptions.length < 4) {
      toast({
        title: "Erro",
        description: "Mercados multi-opção devem ter pelo menos 4 opções",
        variant: "destructive"
      });
      return;
    }
    
    if (validOptions.length < 2) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos 2 opções válidas",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate simple market ID
      const marketId = `m_${Date.now()}`;
      
      // Create equal recompensa for all options
      const baseRecompensa = 2.0;
      const recompensas = validOptions.reduce((acc, option) => {
        acc[option] = baseRecompensa;
        return acc;
      }, {} as Record<string, number>);

      const { error } = await supabase
        .from('markets')
        .insert({
          id: marketId,
          titulo: newMarket.title,
          descricao: newMarket.description,
          categoria: newMarket.category,
          market_type: newMarket.marketType,
          opcoes: validOptions,
          odds: recompensas,
          status: 'aberto',
          end_date: new Date(newMarket.endDate).toISOString()
        });

      if (error) throw error;

      toast({
        title: "Mercado criado!",
        description: `"${newMarket.title}" foi criado com sucesso`,
      });

      setNewMarket({ 
        title: '', 
        description: '', 
        category: '', 
        endDate: '', 
        marketType: 'binary' as MarketType, 
        customOptions: ['sim', 'não'] 
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating market:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar mercado. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Criar Novo Mercado</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Título</label>
            <Input
              placeholder="Ex: Bitcoin atingirá $100k?"
              value={newMarket.title}
              onChange={(e) => setNewMarket({...newMarket, title: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Categoria</label>
            <Select 
              value={newMarket.category} 
              onValueChange={(value) => setNewMarket({...newMarket, category: value})}
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
          <label className="text-sm font-medium mb-2 block">Tipo de Mercado</label>
          <Select value={newMarket.marketType} onValueChange={(value: MarketType) => handleMarketTypeChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="binary">{marketTypeTemplates.binary.label}</SelectItem>
              <SelectItem value="three_way">{marketTypeTemplates.three_way.label}</SelectItem>
              <SelectItem value="multi">{marketTypeTemplates.multi.label}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Descrição</label>
          <Textarea
            placeholder="Descreva detalhadamente o mercado..."
            value={newMarket.description}
            onChange={(e) => setNewMarket({...newMarket, description: e.target.value})}
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Data de Encerramento</label>
          <Input
            type="datetime-local"
            value={newMarket.endDate}
            onChange={(e) => setNewMarket({...newMarket, endDate: e.target.value})}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Opções de Análise</label>
          <div className="space-y-2">
            {newMarket.customOptions.map((option, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder={`Opção ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  disabled={newMarket.marketType === 'three_way'} // Three-way options are fixed
                />
                {newMarket.marketType === 'multi' && newMarket.customOptions.length > 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          
          {newMarket.marketType === 'multi' && newMarket.customOptions.length < 10 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Opção
            </Button>
          )}
          
          {newMarket.marketType === 'three_way' && (
            <p className="text-sm text-muted-foreground mt-2">
              Opções fixas para mercados three-way: Sim, Não, Empate
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={handleCreateMarket} 
            className="shadow-success"
            disabled={isLoading}
          >
            {isLoading ? 'Criando...' : 'Criar Mercado'}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateMarketForm;