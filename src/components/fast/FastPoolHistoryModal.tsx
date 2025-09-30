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
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface FastPoolHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetSymbol: string;
  timeLeft: number;
}

export const FastPoolHistoryModal = ({ open, onOpenChange, assetSymbol, timeLeft }: FastPoolHistoryModalProps) => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();
  const [betAmount, setBetAmount] = useState(0.1);
  const [selectedSide, setSelectedSide] = useState<'sim' | 'nao' | null>(null);
  const [countdown, setCountdown] = useState(timeLeft);
  const [clickedSide, setClickedSide] = useState<'sim' | 'nao' | null>(null);

  // Mock history data for the last 10 results
  const mockHistory = [
    { id: 1, result: 'up', time: '59s ago' },
    { id: 2, result: 'down', time: '1m 59s ago' },
    { id: 3, result: 'same', time: '2m 59s ago' },
    { id: 4, result: 'up', time: '3m 59s ago' },
    { id: 5, result: 'down', time: '4m 59s ago' },
    { id: 6, result: 'up', time: '5m 59s ago' },
    { id: 7, result: 'same', time: '6m 59s ago' },
    { id: 8, result: 'down', time: '7m 59s ago' },
    { id: 9, result: 'up', time: '8m 59s ago' },
    { id: 10, result: 'down', time: '9m 59s ago' },
  ];

  useEffect(() => {
    if (!open) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          onOpenChange(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setCountdown(timeLeft);
    }
  }, [open, timeLeft]);

  const handleBet = (side: 'sim' | 'nao') => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para opinar.",
        variant: "destructive"
      });
      return;
    }

    if (countdown <= 10) {
      toast({
        title: "Tempo esgotado",
        description: "Não é possível opinar nos últimos 10 segundos.",
        variant: "destructive"
      });
      return;
    }

    if (!profile?.saldo_moeda || profile.saldo_moeda < betAmount) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para esta opinião.",
        variant: "destructive"
      });
      return;
    }

    // Add premium animation
    setClickedSide(side);
    setTimeout(() => setClickedSide(null), 400);

    // Simulate bet placement
    toast({
      title: "Ordem enviada!",
      description: `Opinião ${side.toUpperCase()} registrada com ${betAmount} RZ no Pool ${assetSymbol}.`,
    });

    onOpenChange(false);
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getResultText = (result: string) => {
    switch (result) {
      case 'up':
        return 'Subiu';
      case 'down':
        return 'Desceu';
      default:
        return 'Manteve';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-center">
            <ArrowUpDown className="w-5 h-5" />
            Pool {assetSymbol} - Histórico
          </DialogTitle>
          <DialogDescription className="text-center">
            <div className="text-base font-medium mb-2">
              {mockHistory[0]?.time ? 'O ativo vai subir nos próximos 60 segundos?' : 'Pergunta carregando...'}
            </div>
            <div className="text-sm text-muted-foreground">
              Categoria: Commodities
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Countdown - continuous animation */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Tempo restante</span>
            <span className="text-lg font-bold text-[#ff2389]">{countdown}s</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80 transition-all duration-100 ease-linear"
              style={{ width: `${(countdown / 60) * 100}%` }}
            />
          </div>
        </div>

        {/* History */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3">Últimos 10 resultados</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {mockHistory.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  {getResultIcon(item.result)}
                  <span className="text-sm">{getResultText(item.result)}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Betting slider */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-2 block">Valor da opinião: {betAmount} RZ</label>
          <div className="px-4 py-3 bg-muted/20 rounded-lg">
            <input
              type="range"
              min="0.1"
              max="100"
              step="0.1"
              value={betAmount}
              onChange={(e) => setBetAmount(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #00ff90 0%, #00ff90 ${((betAmount - 0.1) / 99.9) * 100}%, hsl(var(--muted)) ${((betAmount - 0.1) / 99.9) * 100}%, hsl(var(--muted)) 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0.1 RZ</span>
              <span>100 RZ</span>
            </div>
          </div>
        </div>

        {/* Bet buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Button
            onClick={() => handleBet('sim')}
            disabled={countdown <= 10}
            className={`h-12 ${
              clickedSide === 'sim' 
                ? 'scale-[1.02] shadow-lg shadow-[#00ff90]/30 ring-2 ring-[#00ff90]/50' 
                : ''
            } bg-[#00ff90] hover:bg-[#00ff90]/90 text-black font-semibold transition-all duration-300`}
          >
            SIM
          </Button>
          <Button
            onClick={() => handleBet('nao')}
            disabled={countdown <= 10}
            className={`h-12 ${
              clickedSide === 'nao' 
                ? 'scale-[1.02] shadow-lg shadow-[#ff2389]/30 ring-2 ring-[#ff2389]/50' 
                : ''
            } bg-[#ff2389] hover:bg-[#ff2389]/90 text-white font-semibold transition-all duration-300`}
          >
            NÃO
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};