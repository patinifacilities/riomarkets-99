import { useEffect } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { ExchangeWidget } from '@/components/exchange/ExchangeWidget';
import { BalancesCard } from '@/components/exchange/BalancesCard';
import { ExchangeHistory } from '@/components/exchange/ExchangeHistory';

const Exchange = () => {
  const { fetchRate, fetchBalance, subscribeToRateUpdates } = useExchangeStore();

  useEffect(() => {
    // Initialize data
    fetchRate();
    fetchBalance();

    // Subscribe to real-time rate updates
    const unsubscribe = subscribeToRateUpdates();

    return () => {
      unsubscribe();
    };
  }, [fetchRate, fetchBalance, subscribeToRateUpdates]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Exchange RIOZ</h1>
          <p className="text-muted-foreground">
            Conversão simples 1:1 - 1 BRL = 1 RIOZ
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Exchange Widget */}
          <div className="lg:col-span-1 space-y-6">
            <ExchangeWidget />
            <BalancesCard />
          </div>

          {/* Right Column - History */}
          <div className="lg:col-span-2">
            <ExchangeHistory />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exchange;