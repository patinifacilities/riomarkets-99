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
import { QrCode, Copy, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  qrCode?: string;
  qrCodeText?: string;
  onSuccess?: () => void;
}

export const PixPaymentModal = ({ open, onOpenChange, amount, qrCode, qrCodeText, onSuccess }: PixPaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      setTimeLeft(15 * 60);
      return;
    }

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
  }, [open, onOpenChange, toast]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Use provided PIX code or fallback to mock code
  const pixCode = qrCodeText || `00020126580014br.gov.bcb.pix013636c92c2b-3a13-4d1c-b7ee-${Date.now()}520400005303986540${amount.replace(/\D/g, '')}.005802BR5915RioMarkets LTDA6009SAO PAULO62070503***6304`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
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
            {qrCode ? (
              <div className="w-48 h-48 rounded-lg border-2 border-border overflow-hidden bg-white p-2">
                <img 
                  src={qrCode} 
                  alt="QR Code PIX" 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    console.error("QR Code image failed to load:", qrCode);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
                <div className="text-center">
                  <QrCode className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Gerando QR Code...</p>
                  <p className="text-xs text-muted-foreground">R$ {amount}</p>
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
                value={pixCode}
                className="w-full h-20 p-3 text-xs bg-muted rounded-md border resize-none font-mono"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={handleCopyCode}
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