import { useEffect, useState } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { ExchangeService } from '@/services/exchange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Wallet, RefreshCw, ArrowRightLeft, Plus } from 'lucide-react';
import { AddBrlModal } from './AddBrlModal';

export const BalancesCard = () => {
  const { balance, balanceLoading, fetchBalance, rate } = useExchangeStore();
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  useEffect(() => {
    // Refresh balance every 30 seconds
    const interval = setInterval(() => {
      fetchBalance();
    }, 30000);

    // Listen for balance updates
    const handleBalanceUpdate = () => {
      fetchBalance();
      refetchProfile();
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdate);
    window.addEventListener('forceProfileRefresh', handleBalanceUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('balanceUpdated', handleBalanceUpdate);
      window.removeEventListener('forceProfileRefresh', handleBalanceUpdate);
    };
  }, [fetchBalance, refetchProfile]);

  const handleRefresh = () => {
    fetchBalance();
    refetchProfile();
  };

  const getTotalValueInBRL = () => {
    if (!balance || !rate || !profile) return 0;
    return balance.brl_balance + (profile.saldo_moeda * rate.price);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-[#00FF91]" />
            Saldo
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
                  {rate && profile ? `≈ ${ExchangeService.formatCurrency((profile.saldo_moeda || 0) * rate.price, 'BRL')}` : ''}
                </span>
              </div>
              <div className="text-lg font-bold tabular-nums">
                {(balance?.rioz_balance || profile?.saldo_moeda || 0).toLocaleString('pt-BR')} RZ
              </div>
            </div>

            <Separator />

            {/* BRL Balance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Real Brasileiro</span>
              </div>
              <div className="text-xl font-bold tabular-nums break-words">
                {ExchangeService.formatCurrency(balance.brl_balance, 'BRL')}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setDepositModalOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar BRL
              </Button>
              
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => {
                  // Trigger convert modal
                  window.dispatchEvent(new CustomEvent('openConvertModal'));
                }}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Converter Agora
              </Button>
            </div>

            <AddBrlModal 
              open={depositModalOpen}
              onOpenChange={setDepositModalOpen}
              onSuccess={handleRefresh}
            />
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