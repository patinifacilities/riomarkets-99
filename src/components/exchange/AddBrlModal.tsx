import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CreditCard, Smartphone, Bitcoin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (amountValue > 100000) {
      toast({
        title: "Valor muito alto",
        description: "O valor máximo para depósito é R$ 100.000,00.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simular depósito BRL - usando RPC para incrementar
      const { error } = await supabase.rpc('increment_brl_balance', {
        user_id: user.id,
        amount_centavos: Math.round(amountValue * 100) // Converter para centavos
      });

      if (error) throw error;

      toast({
        title: "Depósito realizado!",
        description: `R$ ${amountValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} via ${paymentMethod.toUpperCase()} adicionados à sua conta.`,
      });

      setAmount('');
      setPaymentMethod('pix');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error adding BRL:', error);
      toast({
        title: "Erro no depósito",
        description: "Não foi possível processar o depósito. Tente novamente.",
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
          <DialogTitle>Adicionar BRL</DialogTitle>
          <DialogDescription>
            Simule um depósito em reais para testar a Exchange. 
            Valor máximo: R$ 100.000,00.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (BRL)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              min="0.01"
              max="100000"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-right [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    <span>PIX</span>
                  </div>
                </SelectItem>
                <SelectItem value="credit-card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Cartão de Crédito</span>
                  </div>
                </SelectItem>
                <SelectItem value="debit-card">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    <span>Cartão de Débito</span>
                  </div>
                </SelectItem>
                <SelectItem value="crypto">
                  <div className="flex items-center gap-2">
                    <Bitcoin className="w-4 h-4" />
                    <span>Cripto</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !amount}
              className="flex-1 bg-gradient-success hover:opacity-80"
            >
              {isLoading ? 'Processando...' : 'Depositar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};