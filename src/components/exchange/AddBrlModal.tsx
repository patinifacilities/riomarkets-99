import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CreditCard, QrCode, Bitcoin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PixPaymentModal } from '@/components/wallet/PixPaymentModal';

interface AddBrlModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddBrlModal = ({ open, onOpenChange, onSuccess }: AddBrlModalProps) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [isLoading, setIsLoading] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      id: 'debit',
      label: 'Cartão de Débito',
      description: 'Débito direto',
      icon: <CreditCard className="w-5 h-5" />
    },
    {
      id: 'applepay',
      label: 'Apple Pay',
      description: 'Pagamento rápido',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
        </svg>
      )
    },
    {
      id: 'crypto',
      label: 'Cripto',
      description: 'USDT, USDC',
      icon: <Bitcoin className="w-5 h-5" />
    }
  ];

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Convert to number (in centavos) and format as BRL
    const centavos = parseInt(numericValue) || 0;
    const reais = centavos / 100;
    return reais.toLocaleString('pt-BR', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAmount(formatted);
  };

  const handleSubmit = async () => {
    const numericAmount = parseInt(amount.replace(/\D/g, ''));
    if (!amount || numericAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para depósito.",
        variant: "destructive",
      });
      return;
    }

    if (numericAmount < 500) { // 5.00 in centavos (R$ 5,00)
      toast({
        title: "Valor mínimo",
        description: "O valor mínimo para depósito é R$ 5,00.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'pix') {
      setShowPixModal(true);
      return;
    }

    if (paymentMethod === 'card' || paymentMethod === 'debit') {
      // Navigate to card payment page
      onOpenChange(false);
      navigate('/card-payment', { state: { amount, paymentMethod } });
      return;
    }

    setIsLoading(true);
    try {
      // Simular processamento para outros métodos
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
      <DialogContent className="sm:max-w-md rounded-2xl">
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
                type="text"
                placeholder="0"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="pl-10"
              />
            </div>
            {amount && parseInt(amount.replace(/\D/g, '')) > 0 && parseInt(amount.replace(/\D/g, '')) < 500 && (
              <p className="text-xs text-orange-500 flex items-center gap-1">
                <span>⚠️</span>
                <span>O depósito mínimo é R$ 5,00</span>
              </p>
            )}
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
                <label 
                  key={method.id} 
                  htmlFor={method.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors relative cursor-pointer"
                  onClick={() => setPaymentMethod(method.id)}
                >
                  {method.id === 'pix' && (
                    <span className="absolute top-2 right-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white bg-[#ff2389]">
                      Mais usado
                    </span>
                  )}
                  <RadioGroupItem value={method.id} id={method.id} />
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-primary">
                      {method.icon}
                    </div>
                    <div>
                      <span className="font-medium cursor-pointer">
                        {method.label}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {method.description}
                      </p>
                    </div>
                  </div>
                </label>
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
      
      {/* PIX Payment Modal */}
      <PixPaymentModal
        open={showPixModal}
        onOpenChange={setShowPixModal}
        amount={amount}
        onSuccess={() => {
          setAmount('');
          onOpenChange(false);
          onSuccess?.();
        }}
      />
    </Dialog>
  );
};