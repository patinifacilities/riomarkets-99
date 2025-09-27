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
import { ArrowRightLeft, QrCode, Bitcoin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const WithdrawModal = ({ open, onOpenChange, onSuccess }: WithdrawModalProps) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pix');
  const [pixKey, setPixKey] = useState('');
  const [cryptoWallet, setCryptoWallet] = useState('');
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
      id: 'crypto',
      label: 'Cripto',
      description: 'Bitcoin, USDT',
      icon: <Bitcoin className="w-5 h-5" />
    }
  ];

  const formatCurrency = (value: string) => {
    // Remove non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    // Convert to number and format
    const number = parseInt(numericValue) || 0;
    return number.toLocaleString('pt-BR');
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatCurrency(value);
    setAmount(formatted);
  };

  const handleSubmit = async () => {
    if (!amount || parseInt(amount.replace(/\D/g, '')) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido para saque.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'pix' && !pixKey) {
      toast({
        title: "Chave PIX obrigatória",
        description: "Por favor, insira sua chave PIX.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'crypto' && !cryptoWallet) {
      toast({
        title: "Carteira cripto obrigatória",
        description: "Por favor, insira o endereço da sua carteira.",
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
        description: `Saque de R$ ${amount} via ${paymentMethods.find(m => m.id === paymentMethod)?.label} solicitado com sucesso.`,
      });
      
      setAmount('');
      setPixKey('');
      setCryptoWallet('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao processar saque. Tente novamente.",
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
            <ArrowRightLeft className="w-5 h-5" />
            Sacar Fundos
          </DialogTitle>
          <DialogDescription>
            Escolha o método de saque e valor para retirar de sua conta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do saque</Label>
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
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <Label>Método de saque</Label>
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

          {/* PIX Key Input */}
          {paymentMethod === 'pix' && (
            <div className="space-y-2">
              <Label htmlFor="pixKey">Chave PIX</Label>
              <Input
                id="pixKey"
                type="text"
                placeholder="Digite sua chave PIX"
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
              />
            </div>
          )}

          {/* Crypto Wallet Input */}
          {paymentMethod === 'crypto' && (
            <div className="space-y-2">
              <Label htmlFor="cryptoWallet">Endereço da Carteira</Label>
              <Input
                id="cryptoWallet"
                type="text"
                placeholder="Digite o endereço da sua carteira"
                value={cryptoWallet}
                onChange={(e) => setCryptoWallet(e.target.value)}
              />
            </div>
          )}
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
            {isLoading ? "Processando..." : "Sacar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};