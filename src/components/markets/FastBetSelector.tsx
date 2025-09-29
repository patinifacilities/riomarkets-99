import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FastBetSelectorProps {
  onBetSuccess?: () => void;
}

export const FastBetSelector = ({ onBetSuccess }: FastBetSelectorProps) => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();

  const handleAmountChange = (value: string) => {
    const amount = parseInt(value) || 0;
    setBetAmount(Math.max(0, Math.min(amount, profile?.saldo_moeda || 0)));
  };

  const placeBet = async (poolId: number, side: 'sim' | 'nao', odds: number) => {
    if (!user || !profile || betAmount <= 0) return;

    if (betAmount > profile.saldo_moeda) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem RZ suficiente para esta opinião.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Deduct amount from user balance immediately for better UX
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda - betAmount })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      const transactionId = `fast_${poolId}_${user.id}_${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          id: transactionId,
          user_id: user.id,
          tipo: 'debito',
          valor: betAmount,
          descricao: `Opinião Fast Market - Pool ${poolId} (${side.toUpperCase()})`
        });

      if (transactionError) throw transactionError;

      // Store the bet in a simple way (could be expanded later)
      const betData = {
        poolId,
        side,
        amount: betAmount,
        odds,
        userId: user.id,
        timestamp: Date.now(),
        roundNumber: Math.floor(Date.now() / 60000) // Simple round number based on time
      };

      // Store in localStorage for MVP (in production this would be in database)
      const fastBets = JSON.parse(localStorage.getItem('fastBets') || '[]');
      fastBets.push(betData);
      localStorage.setItem('fastBets', JSON.stringify(fastBets));

      toast({
        title: "Opinião registrada!",
        description: `Você opinou ${side.toUpperCase()} com ${betAmount} RZ no Pool ${poolId}.`,
      });

      refetchProfile();
      onBetSuccess?.();
    } catch (error) {
      console.error('Error placing fast bet:', error);
      toast({
        title: "Erro ao registrar opinião",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="border border-[#ff2389]/20 bg-gradient-to-br from-card/95 to-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-center flex items-center justify-center gap-2">
          <Wallet className="h-4 w-4 text-[#ff2389]" />
          Seletor de Valor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <Label className="text-xs text-muted-foreground">Saldo Disponível</Label>
          <p className="text-lg font-bold text-primary">
            {(profile?.saldo_moeda || 0).toLocaleString()} RZ
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bet-amount" className="text-sm">Valor para opinião</Label>
          <Input
            id="bet-amount"
            type="number"
            value={betAmount}
            onChange={(e) => handleAmountChange(e.target.value)}
            min="1"
            max={profile?.saldo_moeda || 0}
            className="text-center font-mono text-lg"
            placeholder="Digite o valor..."
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[25, 50, 100].map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => setBetAmount(amount)}
              className="text-xs"
              disabled={amount > (profile?.saldo_moeda || 0)}
            >
              {amount} RZ
            </Button>
          ))}
        </div>

        <div className="text-center pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Clique em SIM ou NÃO nos pools para opinar com este valor
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Export the function to be used by pool buttons
export const useFastBetting = () => {
  const [betAmount, setBetAmount] = useState<number>(100);
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();

  const placeBet = async (poolId: number, side: 'sim' | 'nao', odds: number) => {
    if (!user || !profile || betAmount <= 0) return;

    if (betAmount > profile.saldo_moeda) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem RZ suficiente para esta opinião.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Deduct amount from user balance immediately
      const { error: balanceError } = await supabase
        .from('profiles')
        .update({ saldo_moeda: profile.saldo_moeda - betAmount })
        .eq('id', user.id);

      if (balanceError) throw balanceError;

      // Create transaction record
      const transactionId = `fast_${poolId}_${user.id}_${Date.now()}`;
      const { error: transactionError } = await supabase
        .from('wallet_transactions')
        .insert({
          id: transactionId,
          user_id: user.id,
          tipo: 'debito',
          valor: betAmount,
          descricao: `Opinião Fast Market - Pool ${poolId} (${side.toUpperCase()})`
        });

      if (transactionError) throw transactionError;

      // Store the bet
      const betData = {
        poolId,
        side,
        amount: betAmount,
        odds,
        userId: user.id,
        timestamp: Date.now(),
        roundNumber: Math.floor(Date.now() / 60000)
      };

      const fastBets = JSON.parse(localStorage.getItem('fastBets') || '[]');
      fastBets.push(betData);
      localStorage.setItem('fastBets', JSON.stringify(fastBets));

      toast({
        title: "Opinião registrada!",
        description: `Você opinou ${side.toUpperCase()} com ${betAmount} RZ.`,
      });

      refetchProfile();
      return true;
    } catch (error) {
      console.error('Error placing fast bet:', error);
      toast({
        title: "Erro ao registrar opinião",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    betAmount,
    setBetAmount,
    placeBet
  };
};