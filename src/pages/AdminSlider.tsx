import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Image as ImageIcon, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarkets } from '@/hooks/useMarkets';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface CustomImage {
  id: string;
  url: string;
  title: string;
}

interface SlideItem {
  id: string;
  type: 'market' | 'image';
  marketId?: string;
  imageUrl?: string;
  title?: string;
}

const AdminSlider = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: markets = [] } = useMarkets('all');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageTitle, setNewImageTitle] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [sliderDelay, setSliderDelay] = useState(7);
  const [slideOrder, setSlideOrder] = useState<SlideItem[]>([]);
  const [configId, setConfigId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing config
  useEffect(() => {
    loadSliderConfig();
  }, []);

  // Update slide order when markets or images change
  useEffect(() => {
    updateSlideOrder();
  }, [selectedMarkets, customImages]);

  const loadSliderConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('slider_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setConfigId(data.id);
        setSelectedMarkets(Array.isArray(data.selected_market_ids) ? data.selected_market_ids : []);
        
        const customImgs = Array.isArray(data.custom_images) 
          ? (data.custom_images as unknown as CustomImage[])
          : [];
        setCustomImages(customImgs);
        setSliderDelay(data.slider_delay_seconds || 7);
        
        // Reconstruct slide order
        const orderIds = Array.isArray(data.slide_order) ? data.slide_order as string[] : [];
        const order: SlideItem[] = orderIds.map((id: string) => {
          if (id.startsWith('custom-')) {
            const img = customImgs.find((i) => i.id === id);
            return {
              id,
              type: 'image' as const,
              imageUrl: img?.url,
              title: img?.title
            };
          } else {
            return {
              id,
              type: 'market' as const,
              marketId: id
            };
          }
        }).filter((item: SlideItem) => item.imageUrl || item.marketId);
        
        setSlideOrder(order);
      }
    } catch (error) {
      console.error('Error loading slider config:', error);
    }
  };

  const updateSlideOrder = () => {
    const newOrder: SlideItem[] = [];
    
    // Add selected markets that aren't already in the order
    selectedMarkets.forEach(marketId => {
      if (!slideOrder.find(s => s.id === marketId)) {
        newOrder.push({ id: marketId, type: 'market', marketId });
      }
    });
    
    // Add custom images that aren't already in the order
    customImages.forEach(img => {
      if (!slideOrder.find(s => s.id === img.id)) {
        newOrder.push({ 
          id: img.id, 
          type: 'image', 
          imageUrl: img.url, 
          title: img.title 
        });
      }
    });
    
    // Keep existing order and add new items
    const existingValidItems = slideOrder.filter(item => 
      (item.type === 'market' && selectedMarkets.includes(item.id)) ||
      (item.type === 'image' && customImages.find(img => img.id === item.id))
    );
    
    setSlideOrder([...existingValidItems, ...newOrder]);
  };

  const handleToggleMarket = (marketId: string) => {
    setSelectedMarkets(prev => 
      prev.includes(marketId) 
        ? prev.filter(id => id !== marketId)
        : [...prev, marketId]
    );
  };

  const handleAddCustomImage = () => {
    if (newImageUrl && newImageTitle) {
      setCustomImages(prev => [...prev, {
        id: `custom-${Date.now()}`,
        url: newImageUrl,
        title: newImageTitle
      }]);
      setNewImageUrl('');
      setNewImageTitle('');
      setImagePreview('');
    }
  };

  // Update preview when URL changes
  const handleImageUrlChange = (url: string) => {
    setNewImageUrl(url);
    // Simple URL validation
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      setImagePreview(url);
    } else {
      setImagePreview('');
    }
  };

  const handleRemoveCustomImage = (id: string) => {
    setCustomImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const slideOrderIds = slideOrder.map(s => s.id);
      
      const payload = {
        selected_market_ids: selectedMarkets,
        custom_images: customImages as any,
        slider_delay_seconds: sliderDelay,
        slide_order: slideOrderIds,
        updated_at: new Date().toISOString()
      };

      let result;
      if (configId) {
        result = await supabase
          .from('slider_config')
          .update(payload)
          .eq('id', configId);
      } else {
        result = await supabase
          .from('slider_config')
          .insert([payload])
          .select()
          .single();
        
        if (result.data) {
          setConfigId(result.data.id);
        }
      }

      if (result.error) throw result.error;

      toast({
        title: 'Sucesso!',
        description: 'Configurações do slider salvas com sucesso.',
      });
    } catch (error) {
      console.error('Error saving slider config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações do slider.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(slideOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSlideOrder(items);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Gerenciar Slider</h1>
              <p className="text-muted-foreground">
                Selecione os mercados e imagens que aparecerão no slider da página inicial
              </p>
            </div>
          </div>
          <Button onClick={handleSave} className="bg-primary" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>

        {/* Slider Delay Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Slider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="slider-delay">Intervalo de Transição (segundos)</Label>
              <Input
                id="slider-delay"
                type="number"
                min="3"
                max="30"
                value={sliderDelay}
                onChange={(e) => setSliderDelay(parseInt(e.target.value) || 7)}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Define quantos segundos cada slide ficará visível antes de passar para o próximo. 
                O slider continuará passando mesmo se o usuário clicar, mas pausará se clicar e segurar.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selected Markets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GripVertical className="h-5 w-5" />
                Mercados Selecionados ({selectedMarkets.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedMarkets.includes(market.id)}
                      onCheckedChange={() => handleToggleMarket(market.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{market.titulo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {market.descricao}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                          {market.categoria}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent">
                          {market.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Imagens Personalizadas ({customImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Image */}
              <div className="space-y-3 p-4 rounded-lg border bg-accent/50">
                <div className="space-y-2">
                  <Label htmlFor="image-title">Título da Imagem</Label>
                  <Input
                    id="image-title"
                    placeholder="Ex: Promoção de Verão"
                    value={newImageTitle}
                    onChange={(e) => setNewImageTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image-url">URL da Imagem</Label>
                  <Input
                    id="image-url"
                    placeholder="https://exemplo.com/imagem.jpg"
                    value={newImageUrl}
                    onChange={(e) => handleImageUrlChange(e.target.value)}
                  />
                </div>
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="rounded-lg overflow-hidden border border-border">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-40 object-cover"
                      onError={() => setImagePreview('')}
                    />
                  </div>
                )}
                
                <Button
                  onClick={handleAddCustomImage}
                  className="w-full"
                  disabled={!newImageUrl || !newImageTitle}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Imagem
                </Button>
              </div>

              {/* Custom Images List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {customImages.map((image) => (
                  <div
                    key={image.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  >
                    <img
                      src={image.url}
                      alt={image.title}
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{image.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {image.url}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCustomImage(image.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {customImages.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Nenhuma imagem personalizada adicionada
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slide Order */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GripVertical className="h-5 w-5" />
              Ordem dos Slides ({slideOrder.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Arraste para reordenar os slides que aparecerão no carrossel
            </p>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="slides">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {slideOrder.map((slide, index) => {
                      const market = slide.type === 'market' 
                        ? markets.find(m => m.id === slide.marketId)
                        : null;
                      
                      return (
                        <Draggable key={slide.id} draggableId={slide.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border bg-card",
                                snapshot.isDragging && "shadow-lg"
                              )}
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1">
                                {slide.type === 'market' && market ? (
                                  <>
                                    <p className="font-medium text-sm">{market.titulo}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Mercado · {market.categoria}
                                    </p>
                                  </>
                                ) : slide.type === 'image' ? (
                                  <>
                                    <p className="font-medium text-sm">{slide.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Imagem Personalizada
                                    </p>
                                  </>
                                ) : null}
                              </div>
                              <span className="text-xs text-muted-foreground">
                                #{index + 1}
                              </span>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {slideOrder.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                Selecione mercados ou adicione imagens para configurar o slider
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSlider;
