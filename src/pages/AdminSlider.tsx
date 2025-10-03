import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, X, Image as ImageIcon, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMarkets } from '@/hooks/useMarkets';
import { Checkbox } from '@/components/ui/checkbox';

const AdminSlider = () => {
  const navigate = useNavigate();
  const { data: markets = [] } = useMarkets('all');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [customImages, setCustomImages] = useState<Array<{ id: string; url: string; title: string }>>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageTitle, setNewImageTitle] = useState('');

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
    }
  };

  const handleRemoveCustomImage = (id: string) => {
    setCustomImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSave = () => {
    // TODO: Implement save to database
    console.log('Selected markets:', selectedMarkets);
    console.log('Custom images:', customImages);
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
          <Button onClick={handleSave} className="bg-primary">
            Salvar Alterações
          </Button>
        </div>

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
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                </div>
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

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preview do Slider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8 bg-accent/30 rounded-lg border-2 border-dashed">
              <p className="text-muted-foreground">
                Preview será implementado em breve
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSlider;
