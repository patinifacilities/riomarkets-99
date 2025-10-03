import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from './ImageCropper';

interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  onImageCropped: (imageUrl: string, cropArea: any) => void;
  initialImageUrl?: string;
}

export const ImageUploadModal = ({ open, onClose, onImageCropped, initialImageUrl }: ImageUploadModalProps) => {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState(initialImageUrl || '');
  const [showCropper, setShowCropper] = useState(!!initialImageUrl);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Convert to URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = (cropArea: any) => {
    onImageCropped(imageUrl, cropArea);
    handleClose();
  };

  const handleClose = () => {
    setImageUrl('');
    setShowCropper(false);
    onClose();
  };

  if (showCropper && imageUrl) {
    return (
      <ImageCropper
        open={open}
        imageUrl={imageUrl}
        onCropComplete={handleCropComplete}
        onClose={handleClose}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload de Imagem</DialogTitle>
          <DialogDescription>
            Arraste uma imagem ou clique para selecionar. Resolução recomendada: 1920x600px
          </DialogDescription>
        </DialogHeader>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            onChange={handleFileInput}
          />
          
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center justify-center cursor-pointer"
          >
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              {dragActive ? (
                <Upload className="w-8 h-8 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="w-8 h-8 text-primary" />
              )}
            </div>
            
            <p className="text-sm font-medium mb-1">
              {dragActive ? 'Solte a imagem aqui' : 'Arraste uma imagem ou clique para selecionar'}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, WEBP até 5MB
            </p>
          </label>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Dica:</strong> Para melhores resultados, use imagens com resolução de 1920x600px (proporção 16:5)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
