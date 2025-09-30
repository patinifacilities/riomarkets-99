import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, ArrowUp, ArrowDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FastPool {
  id: string;
  round_number: number;
  asset_symbol: string;
  asset_name: string;
  question: string;
  category: string;
  opening_price: number;
  closing_price?: number;
  round_start_time: string;
  round_end_time: string;
  base_odds: number;
  status: string;
  result?: string;
  paused?: boolean;
}

interface FastPoolExpandedModalProps {
  pool: FastPool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  countdown: number;
  betAmount: number;
  setBetAmount: (amount: number) => void;
  onBet: (poolId: string, side: 'subiu' | 'desceu') => void;
  clickedPool: {id: string, side: string} | null;
  getOdds: () => number;
  userPoolBet?: number;
  poolResult?: 'subiu' | 'desceu' | 'manteve' | null;
}

export const FastPoolExpandedModal = ({ 
  pool, 
  open, 
  onOpenChange, 
  countdown,
  betAmount,
  setBetAmount,
  onBet,
  clickedPool,
  getOdds,
  userPoolBet = 0,
  poolResult
}: FastPoolExpandedModalProps) => {
  if (!pool) return null;

  const currentOdds = getOdds();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{pool.asset_symbol === 'BTC' ? '₿' : pool.asset_symbol === 'ETH' ? 'Ξ' : '📈'}</span>
              <div>
                <div className="text-xl font-bold">{pool.asset_name}</div>
                <div className="text-sm text-muted-foreground font-normal">
                  Pool #{pool.round_number} • ${pool.opening_price.toLocaleString()}
                </div>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Countdown */}
          <Card>
            <CardContent className="pt-6 text-center">
              <div className={cn(
                "text-5xl font-bold mb-2",
                countdown <= 0 
                  ? poolResult === 'subiu' 
                    ? 'text-[#00ff90]' 
                    : poolResult === 'desceu' 
                    ? 'text-[#ff2389]' 
                    : 'text-muted-foreground'
                  : countdown <= 23
                  ? 'text-[#ff2389]'
                  : 'text-foreground'
              )}
              style={countdown <= 23 && countdown > 0 ? {
                animation: `heartbeat ${Math.max(0.3, countdown / 60)}s ease-in-out infinite`
              } : undefined}
              >
                {countdown > 0 
                  ? `${countdown.toFixed(2)}s` 
                  : poolResult === 'subiu'
                  ? 'Subiu! 📈'
                  : poolResult === 'desceu'
                  ? 'Desceu! 📉'
                  : poolResult === 'manteve'
                  ? 'Manteve! ➡️'
                  : 'Aguarde...'
                }
              </div>
              <div className="w-full bg-muted/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#ff2389] to-[#ff2389]/80"
                  style={{ 
                    width: `${(countdown / 60) * 100}%`,
                    transition: 'width 16ms linear'
                  }}
                />
              </div>
              {userPoolBet > 0 && (
                <div className="mt-4 text-sm">
                  Seu total: <span className="text-[#00ff90] font-semibold">{userPoolBet} RZ</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bet Amount Slider */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Opinar {betAmount} RZ
                </label>
                <div className="px-3 py-2 bg-muted/20 rounded-lg">
                  <input
                    type="range"
                    min="1"
                    max="1000"
                    step="1"
                    value={betAmount}
                    onChange={(e) => setBetAmount(Number(e.target.value))}
                    className="w-full h-6 bg-muted rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, #00ff90 0%, #00ff90 ${((betAmount - 1) / 999) * 100}%, hsl(var(--muted)) ${((betAmount - 1) / 999) * 100}%, hsl(var(--muted)) 100%)`
                    }}
                  />
                  <style>{`
                    input[type="range"]::-webkit-slider-thumb {
                      appearance: none;
                      width: 28px;
                      height: 28px;
                      border-radius: 50%;
                      background: #00ff90;
                      cursor: pointer;
                      border: 4px solid white;
                      box-shadow: 0 2px 8px rgba(0, 255, 144, 0.5);
                    }
                    input[type="range"]::-moz-range-thumb {
                      width: 28px;
                      height: 28px;
                      border-radius: 50%;
                      background: #00ff90;
                      cursor: pointer;
                      border: 4px solid white;
                      box-shadow: 0 2px 8px rgba(0, 255, 144, 0.5);
                    }
                  `}</style>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1 RZ</span>
                    <span>1.000 RZ</span>
                  </div>
                </div>
              </div>

              <div className="text-center p-4 bg-muted/20 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Multiplicador Atual</div>
                <div className="text-3xl font-bold text-primary">{currentOdds.toFixed(2)}x</div>
              </div>
            </CardContent>
          </Card>

          {/* Bet Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => onBet(pool.id, 'subiu')}
              disabled={countdown <= 10 || countdown <= 0 || pool.paused}
              className={cn(
                "h-24 text-lg font-bold transition-all duration-200",
                clickedPool?.id === pool.id && clickedPool?.side === 'subiu'
                  ? 'bg-[#00ff90] text-black scale-95 opacity-70'
                  : 'bg-[#00ff90] text-black hover:bg-[#00ff90]/90 hover:scale-105'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <ArrowUp className="w-8 h-8" />
                <span>VAI SUBIR</span>
              </div>
            </Button>

            <Button
              onClick={() => onBet(pool.id, 'desceu')}
              disabled={countdown <= 10 || countdown <= 0 || pool.paused}
              className={cn(
                "h-24 text-lg font-bold transition-all duration-200",
                clickedPool?.id === pool.id && clickedPool?.side === 'desceu'
                  ? 'bg-[#ff2389] text-white scale-95 opacity-70'
                  : 'bg-[#ff2389] text-white hover:bg-[#ff2389]/90 hover:scale-105'
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <ArrowDown className="w-8 h-8" />
                <span>VAI DESCER</span>
              </div>
            </Button>
          </div>

          {countdown <= 10 && countdown > 0 && (
            <div className="text-center text-sm text-muted-foreground bg-warning/10 p-3 rounded-lg">
              ⚠️ Apostas bloqueadas nos últimos 10 segundos
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
