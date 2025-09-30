import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, ArrowUp, ArrowDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

interface FastPoolResult {
  id: string;
  result: 'subiu' | 'desceu' | 'manteve';
  opening_price: number;
  closing_price: number;
  price_change_percent: number;
  created_at: string;
  asset_symbol: string;
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
  opinionNotifications?: {id: string, text: string, side?: 'subiu' | 'desceu', timestamp: number}[];
  poolSpecificHistory?: FastPoolResult[];
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
  poolResult,
  opinionNotifications = [],
  poolSpecificHistory = []
}: FastPoolExpandedModalProps) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const [poolHistory, setPoolHistory] = React.useState<FastPoolResult[]>([]);
  const [historyIndex, setHistoryIndex] = React.useState(0);
  
  // Load pool-specific history from database
  React.useEffect(() => {
    if (!pool || !open) return;
    
    const loadPoolHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('fast_pool_results')
          .select('*')
          .eq('asset_symbol', pool.asset_symbol)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        setPoolHistory((data || []).map(item => ({
          ...item,
          result: item.result as 'subiu' | 'desceu' | 'manteve'
        })));
      } catch (error) {
        console.error('Error loading pool history:', error);
      }
    };
    
    loadPoolHistory();
  }, [pool, open]);
  
  // NOW we can do early returns after all hooks are called
  if (!pool) return null;

  const currentOdds = getOdds();
  
  // Get 4 results to display based on current index
  const displayedResults = poolHistory.slice(historyIndex, historyIndex + 4);
  const canScrollLeft = historyIndex > 0;
  const canScrollRight = historyIndex + 4 < poolHistory.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-50"
        >
          <X className="h-6 w-6" />
          <span className="sr-only">Close</span>
        </button>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-8">
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
              <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total RIOZ Investido:</span>
                <span className="text-[#00ff90] font-semibold text-lg">{userPoolBet} RZ</span>
              </div>
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
              ⚠️ Opiniões bloqueadas nos últimos 10 segundos
            </div>
          )}
          
          {/* Last 10 Results for this Pool with scrolling */}
          {poolHistory.length > 0 && (
            <Card className="bg-muted/20 border-border/50 relative">
              <CardContent className="pt-4">
                <h4 className="text-sm font-semibold mb-3">Últimos Resultados deste Pool</h4>
                
                {/* Left Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 h-12 w-8 rounded-r-lg z-10"
                  onClick={() => setHistoryIndex(Math.max(0, historyIndex - 4))}
                  disabled={!canScrollLeft}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                
                {/* Right Arrow */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 h-12 w-8 rounded-l-lg z-10"
                  onClick={() => setHistoryIndex(Math.min(poolHistory.length - 4, historyIndex + 4))}
                  disabled={!canScrollRight}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                
                <div className="grid grid-cols-4 gap-2 px-8">
                  {displayedResults.map((result) => (
                    <div
                      key={result.id}
                      className={`flex flex-col items-center p-2 rounded-lg border ${
                        result.result === 'subiu'
                          ? 'bg-[#00ff90]/10 border-[#00ff90]/30'
                          : result.result === 'desceu'
                          ? 'bg-[#ff2389]/10 border-[#ff2389]/30'
                          : 'bg-muted/30 border-muted-foreground/30'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${
                        result.result === 'subiu'
                          ? 'bg-green-100 dark:bg-green-900/30'
                          : result.result === 'desceu'
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : 'bg-gray-100 dark:bg-gray-900/30'
                      }`}>
                        {result.result === 'subiu' ? (
                          <TrendingUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                        ) : result.result === 'desceu' ? (
                          <TrendingDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                        ) : (
                          <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400">=</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {result.price_change_percent > 0 ? '+' : ''}{result.price_change_percent.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Opinion Notifications in Modal */}
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-xs">
          {opinionNotifications.map((notification, index) => (
            <div 
              key={notification.id}
              className={`px-4 py-2 rounded-lg shadow-lg border animate-scale-in ${
                notification.side === 'subiu' 
                  ? 'bg-[#00ff90] text-black border-[#00ff90]' 
                  : 'bg-[#ff2389] text-white border-[#ff2389]'
              }`}
              style={{ 
                zIndex: 50 - index 
              }}
            >
              <p className="font-medium text-sm">{notification.text}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
