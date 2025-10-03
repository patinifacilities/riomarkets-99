import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QrCode, Copy, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  onSuccess?: () => void;
}

export const PixPaymentModal = ({ open, onOpenChange, amount, onSuccess }: PixPaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeText: string; expiresAt: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const { toast } = useToast();

  // Generate PIX payment when modal opens
  useEffect(() => {
    if (!open) {
      setPixData(null);
      setTimeLeft(0);
      return;
    }

    const generatePixPayment = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('generate-pix-payment', {
          body: { amount: parseFloat(amount) }
        });

        if (error) throw error;

        console.log('PIX payment data:', data);

        if (data && data.success) {
          console.log('Full payment data:', data);
          console.log('QR Code:', data.qrCode?.substring(0, 100));
          console.log('QR Code Text:', data.qrCodeText?.substring(0, 100));
          console.log('Expires At:', data.expiresAt);
          
          setPixData({
            qrCode: data.qrCode || '',
            qrCodeText: data.qrCodeText || '',
            expiresAt: data.expiresAt || ''
          });
          
          // Calculate initial time left
          if (data.expiresAt) {
            const expiryTime = new Date(data.expiresAt).getTime();
            const now = new Date().getTime();
            const timeLeftSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
            console.log('Expiry time:', expiryTime, 'Now:', now, 'Time left:', timeLeftSeconds);
            setTimeLeft(timeLeftSeconds);
          } else {
            // Default to 15 minutes if no expiry time
            console.log('No expiry time, defaulting to 15 minutes');
            setTimeLeft(15 * 60);
          }
        } else {
          console.error('Invalid payment data - missing success or data:', data);
          toast({
            title: "Erro",
            description: "Dados de pagamento inválidos recebidos.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error generating PIX payment:', error);
        toast({
          title: "Erro",
          description: "Não foi possível gerar o pagamento PIX. Tente novamente.",
          variant: "destructive",
        });
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    };

    generatePixPayment();
  }, [open, amount, onOpenChange, toast]);

  // Timer countdown
  useEffect(() => {
    if (!pixData || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onOpenChange(false);
          toast({
            title: "Tempo esgotado",
            description: "O código PIX expirou. Tente novamente.",
            variant: "destructive",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pixData, timeLeft, onOpenChange, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCopyCode = async () => {
    if (!pixData?.qrCodeText) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCodeText);
      setCopied(true);
      toast({
        title: "Chave PIX copiada!",
        description: "Cole no app do seu banco para pagar.",
        className: "bg-[#00ff90] text-gray-800 border-0",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o código.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = () => {
    toast({
      title: "Depósito sendo processado",
      description: "Seu depósito está sendo processado e será creditado em breve.",
      className: "bg-success text-success-foreground border-0 rounded-lg",
    });
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Pagamento PIX
          </DialogTitle>
          <DialogDescription>
            Use o código PIX ou QR code abaixo para completar seu depósito de R$ {amount}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#ff2389]/30" style={{ backgroundColor: '#ff2389' }}>
            <Clock className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">
              Código expira em: {formatTime(timeLeft)}
            </span>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            {loading ? (
              <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
                <div className="text-center">
                  <Loader2 className="w-16 h-16 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                  <p className="text-xs text-muted-foreground">R$ {amount}</p>
                </div>
              </div>
            ) : pixData?.qrCode ? (
              <div className="w-48 h-48 rounded-lg border-2 border-border overflow-hidden bg-white p-2">
                <img 
                  src={pixData.qrCode} 
                  alt="QR Code PIX" 
                  className="w-full h-full object-contain" 
                />
              </div>
            ) : (
              <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
                <div className="text-center">
                  <QrCode className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">QR Code não disponível</p>
                </div>
              </div>
            )}
          </div>

          {/* PIX Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Código PIX Copia e Cola</label>
            <div className="relative">
              <textarea
                readOnly
                value={pixData?.qrCodeText || ''}
                className="w-full h-20 p-3 text-xs bg-muted rounded-md border resize-none font-mono"
                disabled={!pixData}
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={handleCopyCode}
                disabled={!pixData}
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Como pagar:</h4>
            <ol className="text-sm space-y-1 text-muted-foreground">
              <li>1. Abra o app do seu banco</li>
              <li>2. Escaneie o QR code ou copie o código PIX</li>
              <li>3. Confirme o pagamento</li>
              <li>4. Clique em "Pagamento Realizado" abaixo</li>
            </ol>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmPayment}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Pagamento Realizado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};