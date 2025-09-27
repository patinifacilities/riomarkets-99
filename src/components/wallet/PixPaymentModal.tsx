import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QrCode, Copy, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PixPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  onSuccess?: () => void;
}

export const PixPaymentModal = ({ open, onOpenChange, amount, onSuccess }: PixPaymentModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Generate mock PIX code (in real app, this would come from payment processor)
  const pixCode = `00020126580014br.gov.bcb.pix013636c92c2b-3a13-4d1c-b7ee-${Date.now()}520400005303986540${amount.replace(/\D/g, '')}.005802BR5915RioMarkets LTDA6009SAO PAULO62070503***6304`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast({
        title: "Código copiado!",
        description: "O código PIX foi copiado para a área de transferência.",
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
      title: "Pagamento confirmado!",
      description: "Seu depósito será processado em alguns minutos.",
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
          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="w-48 h-48 border-2 border-dashed border-border rounded-lg flex items-center justify-center bg-muted/20">
              <div className="text-center">
                <QrCode className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">QR Code PIX</p>
                <p className="text-xs text-muted-foreground">R$ {amount}</p>
              </div>
            </div>
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