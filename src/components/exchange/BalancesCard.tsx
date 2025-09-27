import { useEffect } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { ExchangeService } from '@/services/exchange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Wallet, RefreshCw, ArrowRightLeft } from 'lucide-react';
import { AddBrlModal } from './AddBrlModal';

export const BalancesCard = () => {
  const { balance, balanceLoading, fetchBalance, rate } = useExchangeStore();

  useEffect(() => {
    // Refresh balance every 30 seconds
    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchBalance]);

  const handleRefresh = () => {
    fetchBalance();
  };

  const getTotalValueInBRL = () => {
    if (!balance || !rate) return 0;
    return balance.brl_balance + (balance.rioz_balance * rate.price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#00FF91]" />
            Seus Saldos
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={balanceLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${balanceLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {balanceLoading && !balance ? (
          <div className="text-center text-muted-foreground py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            Carregando saldos...
          </div>
        ) : balance ? (
          <>
            {/* Rioz Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rioz Coin</span>
                <span className="text-xs text-muted-foreground">
                  {rate ? `≈ ${ExchangeService.formatCurrency(balance.rioz_balance * rate.price, 'BRL')}` : ''}
                </span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {ExchangeService.formatCurrency(balance.rioz_balance, 'RIOZ')}
              </div>
            </div>

            <Separator />

            {/* BRL Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Real Brasileiro</span>
              </div>
              <div className="text-2xl font-bold tabular-nums">
                {ExchangeService.formatCurrency(balance.brl_balance, 'BRL')}
              </div>
            </div>

            <Separator />

            {/* Total Value */}
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">Valor Total</span>
              <div className="text-lg font-semibold tabular-nums text-[#00FF91]">
                {ExchangeService.formatCurrency(getTotalValueInBRL(), 'BRL')}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <AddBrlModal onSuccess={handleRefresh} />
              
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => {
                  // Scroll to exchange widget or focus on it
                  document.querySelector('[data-exchange-widget]')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  });
                }}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Converter Agora
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Erro ao carregar saldos</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={handleRefresh}
            >
              Tentar novamente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};