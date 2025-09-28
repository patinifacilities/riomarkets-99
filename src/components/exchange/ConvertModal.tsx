import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowRightLeft, Loader2 } from 'lucide-react';
import { ExchangeService } from '@/services/exchange';

interface ConvertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const ConvertModal = ({ open, onOpenChange, onSuccess }: ConvertModalProps) => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { balance, rate, performExchange, fetchBalance } = useExchangeStore();
  const { toast } = useToast();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  useEffect(() => {
    if (open) {
      setAmount('');
      setActiveTab('buy');
    }
  }, [open]);

  const handleConvert = async () => {
    if (!user?.id || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    
    // Validate balances
    if (activeTab === 'buy') {
      const totalCost = amountNum * (rate?.price || 1);
      if ((balance?.brl_balance || 0) < totalCost) {
        toast({
          title: "Erro",
          description: "Saldo BRL insuficiente",
          variant: "destructive",
        });
        return;
      }
    } else {
      if ((profile?.saldo_moeda || 0) < amountNum) {
        toast({
          title: "Erro",
          description: "Saldo RIOZ insuficiente",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (activeTab === 'buy') {
        await performExchange('buy_rioz', amountNum, 'RIOZ');
      } else {
        await performExchange('sell_rioz', amountNum, 'RIOZ');
      }
      
      // Refresh balances
      await Promise.all([fetchBalance(), refetchProfile()]);
      
      toast({
        title: "Conversão realizada!",
        description: `${activeTab === 'buy' ? 'Compra' : 'Venda'} de ${amountNum} RIOZ executada com sucesso.`,
      });
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erro na conversão",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPreviewValue = () => {
    if (!amount || !rate) return '0,00';
    const amountNum = parseFloat(amount);
    if (activeTab === 'buy') {
      return ExchangeService.formatCurrency(amountNum * rate.price, 'BRL');
    } else {
      return ExchangeService.formatCurrency(amountNum * rate.price, 'BRL');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-primary" />
            Conversão Imediata
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy" className="data-[state=active]:bg-[#00ff90] data-[state=active]:text-black">
                Comprar RIOZ
              </TabsTrigger>
              <TabsTrigger value="sell" className="data-[state=active]:bg-[#ff2389] data-[state=active]:text-white">
                Vender RIOZ
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="buy" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Quantidade RIOZ</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Preço atual:</span>
                  <span>R$ {rate?.price?.toFixed(4) || '1.0000'} por RIOZ</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor total:</span>
                  <span className="font-medium">{getPreviewValue()}</span>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span>Saldo BRL disponível:</span>
                  <span>{ExchangeService.formatCurrency(balance?.brl_balance || 0, 'BRL')}</span>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sell" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>Quantidade RIOZ</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Preço atual:</span>
                  <span>R$ {rate?.price?.toFixed(4) || '1.0000'} por RIOZ</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor a receber:</span>
                  <span className="font-medium">{getPreviewValue()}</span>
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span>Saldo RIOZ disponível:</span>
                  <span>{(profile?.saldo_moeda || 0).toLocaleString('pt-BR')} RZ</span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConvert}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className={`flex-1 ${
                activeTab === 'buy' 
                  ? 'bg-[#00ff90] hover:bg-[#00ff90]/90 text-black' 
                  : 'bg-[#ff2389] hover:bg-[#ff2389]/90 text-white'
              }`}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRightLeft className="h-4 w-4 mr-2" />
              )}
              {activeTab === 'buy' ? 'Comprar' : 'Vender'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};