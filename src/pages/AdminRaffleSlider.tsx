import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X, Crop, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ImageUploadModal } from '@/components/admin/ImageUploadModal';

interface CustomImage {
  id: string;
  url: string;
  title: string;
}

const AdminRaffleSlider = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customImages, setCustomImages] = useState<CustomImage[]>([]);
  const [sliderDelay, setSliderDelay] = useState(7);
  const [configId, setConfigId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  useEffect(() => {
    loadSliderConfig();
  }, []);

  const loadSliderConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('raffle_slider_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfigId(data.id);
        const images = Array.isArray(data.images) 
          ? (data.images as unknown as CustomImage[])
          : [];
        setCustomImages(images);
        setSliderDelay(data.slider_delay_seconds || 7);
      }
    } catch (error) {
      console.error('Error loading raffle slider config:', error);
    }
  };

  const handleImageCropped = (imageUrl: string) => {
    setCustomImages(prev => [...prev, {
      id: `raffle-${Date.now()}`,
      url: imageUrl,
      title: 'Rifa'
    }]);
    setUploadModalOpen(false);
  };

  const handleRemoveImage = (id: string) => {
    setCustomImages(prev => prev.filter(img => img.id !== id));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        images: customImages as any,
        slider_delay_seconds: sliderDelay,
        updated_at: new Date().toISOString()
      };

      let result;
      if (configId) {
        result = await supabase
          .from('raffle_slider_config')
          .update(payload)
          .eq('id', configId);
      } else {
        result = await supabase
          .from('raffle_slider_config')
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
        description: 'Configurações do slider de rifas salvas.',
      });
    } catch (error) {
      console.error('Error saving raffle slider config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configurações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin/raffles')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Slider de Rifas</h1>
              <p className="text-muted-foreground">
                Configure o banner/slider da página de rifas
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        {/* Slider Delay */}
        <Card>
          <CardHeader>
            <CardTitle>Intervalo do Slider</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Intervalo (segundos)</Label>
              <Input
                type="number"
                min="3"
                max="30"
                value={sliderDelay}
                onChange={(e) => setSliderDelay(parseInt(e.target.value) || 7)}
                className="max-w-xs"
              />
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Imagens do Slider ({customImages.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setUploadModalOpen(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Imagem
            </Button>

            <div className="grid md:grid-cols-2 gap-4">
              {customImages.map((image) => (
                <div
                  key={image.id}
                  className="relative rounded-lg overflow-hidden border border-border group"
                >
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-48 object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(image.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {customImages.length === 0 && (
                <p className="col-span-2 text-center text-sm text-muted-foreground py-8">
                  Nenhuma imagem adicionada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <ImageUploadModal
        open={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onImageCropped={handleImageCropped}
      />
    </div>
  );
};

export default AdminRaffleSlider;
