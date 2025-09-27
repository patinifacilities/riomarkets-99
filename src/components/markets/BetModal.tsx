import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, TrendingUp, Calculator } from 'lucide-react';
import { Market } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MarketPool } from '@/hooks/useMarketPools';
import { BetSlider } from './BetSlider';

interface BetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market;
  selectedOption: string;
  userBalance: number;
  userId: string | undefined;
  recompensa?: number;
  onBetSuccess?: () => void;
}

const BetModal = ({ 
  open, 
  onOpenChange, 
  market, 
  selectedOption, 
  userBalance, 
  userId,
  recompensa = 1,
  onBetSuccess 
}: BetModalProps) => {
  const [betAmount, setBetAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const betValue = parseInt(betAmount) || 0;
  const potentialReturn = Math.round(betValue * recompensa);
  const potentialProfit = potentialReturn - betValue;

  const validateBet = (): string | null => {
    if (!userId) return 'Você precisa estar logado para opinar';
    if (betValue < 5) return 'Valor mínimo: 5 Rioz Coin';
    if (betValue > 10000) return 'Valor máximo: 10.000 Rioz Coin';
    if (betValue > userBalance) return 'Saldo insuficiente';
    if (market.status !== 'aberto') return 'Este mercado não está mais aberto';
    return null;
  };

  const handleBet = async () => {
    const error = validateBet();
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Start transaction
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          market_id: market.id,
          opcao_escolhida: selectedOption,
          quantidade_moeda: betValue,
          preco: recompensa,
          status: 'ativa',
          entry_percent: 0, // Will be updated by trigger or app logic
          entry_multiple: recompensa
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create debit transaction
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          id: crypto.randomUUID(),
          user_id: userId,
          tipo: 'debito',
          valor: betValue,
          descricao: `Análise em: ${market.titulo} (${selectedOption}) — entrada ${recompensa}x recompensa`,
        });

      if (transactionError) throw transactionError;

      // Update user balance
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: userBalance - betValue })
        .eq('id', userId);

      if (balanceError) throw balanceError;

      toast({
        title: "Análise confirmada!",
        description: `Você investiu ${betValue} Rioz Coin em "${selectedOption}". Boa sorte!`,
      });

      setBetAmount('');
      onOpenChange(false);
      onBetSuccess?.();

    } catch (error: any) {
      console.error('Bet error:', error);
      toast({
        title: "Erro ao processar análise",
        description: error.message || "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const errorMessage = validateBet();
  const isOptionSim = selectedOption === 'sim';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Confirmar Análise
          </DialogTitle>
          <DialogDescription>
            {market.titulo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected Option */}
          <div className="flex justify-center">
            <Badge 
              className={`text-lg px-4 py-2 ${
                isOptionSim 
                  ? 'bg-[#00FF91] text-black' 
                  : 'bg-[#FF1493] text-white'
              }`}
            >
              {selectedOption.toUpperCase()} - {recompensa.toFixed(2)}x
            </Badge>
          </div>

          {/* Current Balance */}
          <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'hsl(169 100% 50% / 0.2)' }}>
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Seu saldo:</span>
            </div>
            <span className="font-semibold">{userBalance} Rioz Coin</span>
          </div>

          {/* Bet Amount Slider */}
          <BetSlider
            balance={userBalance}
            onAmountChange={(amount) => setBetAmount(amount.toString())}
            estimatedReward={recompensa}
          />

          {/* Potential Return */}
          {betValue >= 5 && (
            <div className="p-3 rounded-lg border border-primary/20" style={{ backgroundColor: 'hsl(169 100% 50% / 0.1)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">Retorno Estimado</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Retorno total:</span>
                  <div className="font-semibold">{potentialReturn} Rioz Coin</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Lucro:</span>
                  <div className="font-semibold text-success">+{potentialProfit} Rioz Coin</div>
                </div>
              </div>
            </div>
          )}

          {/* Pool Info - Remove for now, will be handled by new rewards system */}
          <div className="p-3 border rounded-lg text-sm space-y-1" style={{ backgroundColor: 'hsl(169 100% 50% / 0.1)' }}>
            <div className="font-medium">Recompensa atual:</div>
            <div className="text-center text-lg font-semibold text-primary">
              {recompensa.toFixed(2)}x
            </div>
            <div className="text-muted-foreground text-center">
              Multiplicador estimado se esta opção vencer
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleBet}
              disabled={!!errorMessage || isLoading}
              className="flex-1 min-h-[44px]"
              size="default"
              aria-label={`Confirmar opinião de ${betValue || 0} Rioz Coin em ${selectedOption.toUpperCase()}`}
            >
              {isLoading ? 'Processando...' : `Opinar ${betValue || 0} Rioz Coin`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BetModal;