import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Building, Smartphone, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddBrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddBrlModal = ({ open, onOpenChange, onSuccess }: AddBrlModalProps) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const paymentMethods = [
    {
      id: 'pix',
      label: 'PIX',
      description: 'Transferência instantânea',
      icon: <QrCode className="w-5 h-5" />
    },
    {
      id: 'card',
      label: 'Cartão de Crédito',
      description: 'Visa, Mastercard, Elo',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'bank',
      label: 'Transferência Bancária',
      description: 'TED/DOC',
      icon: <Building className="w-5 h-5" />
    },
    {
      id: 'app',
      label: 'Carteira Digital',
      description: 'PicPay, Mercado Pago',
      icon: <Smartphone className="w-5 h-5" />
    }
  ];

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para depósito.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Solicitação enviada",
        description: `Depósito de R$ ${amount} via ${paymentMethods.find(m => m.id === paymentMethod)?.label} solicitado com sucesso.`,
      });
      
      setAmount('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar depósito. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Depositar BRL
          </DialogTitle>
          <DialogDescription>
            Escolha o método de pagamento e valor para depositar em sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do depósito</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                R$
              </span>
              <Input
                id="amount"
                type="number"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                min="1"
                step="0.01"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Método de pagamento</Label>
            <RadioGroup
              value={paymentMethod}
              onValueChange={setPaymentMethod}
              className="space-y-3"
            >
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-primary">
                      {method.icon}
                    </div>
                    <div>
                      <Label htmlFor={method.id} className="font-medium cursor-pointer">
                        {method.label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            {isLoading ? "Processando..." : "Depositar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};