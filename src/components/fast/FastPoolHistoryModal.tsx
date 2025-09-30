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
      <DialogContent className="sm:max-w-lg rounded-xl border-primary/20 bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-[#ff2389]/5 rounded-xl"></div>
        
        <div className="relative z-10">
          <DialogHeader className="text-center pb-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowUpDown className="w-4 h-4 text-primary" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold">
              Histórico - {assetSymbol}
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="text-sm text-muted-foreground">
                Últimos resultados da categoria
              </div>
            </DialogDescription>
          </DialogHeader>

          {/* History */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full"></span>
              Últimos 10 resultados
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
              {mockHistory.map((item, index) => (
                <div 
                  key={item.id} 
                  className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 ${
                    index < 3 
                      ? 'bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20' 
                      : 'bg-muted/20 border-border'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                    item.result === 'up' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : item.result === 'down'
                      ? 'bg-red-100 dark:bg-red-900/30'
                      : 'bg-gray-100 dark:bg-gray-900/30'
                  }`}>
                    {getResultIcon(item.result)}
                  </div>
                  <span className="text-xs font-medium">{getResultText(item.result)}</span>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};