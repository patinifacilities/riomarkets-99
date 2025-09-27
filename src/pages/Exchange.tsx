import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { ExchangeWidget } from '@/components/exchange/ExchangeWidget';
import { BalancesCard } from '@/components/exchange/BalancesCard';
import { ExchangeHistory } from '@/components/exchange/ExchangeHistory';
import { FunctionalOrderBook } from '@/components/exchange/FunctionalOrderBook';
import { BalanceDonutChart } from '@/components/exchange/BalanceDonutChart';
import { track } from '@/lib/analytics';

const Exchange = () => {
  const { user } = useAuth();
  const { 
    fetchRate, 
    fetchBalance, 
    fetchHistory, 
    subscribeToRateUpdates 
  } = useExchangeStore();

  useEffect(() => {
    if (user) {
      // Track page view
      track('view_exchange_page', { user_id: user.id });
      
      // Fetch initial data
      fetchRate();
      fetchBalance();
      fetchHistory();
      
      // Subscribe to real-time rate updates
      const unsubscribe = subscribeToRateUpdates();
      
      return unsubscribe;
    }
  }, [user, fetchRate, fetchBalance, fetchHistory, subscribeToRateUpdates]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Exchange Rioz Coin</h1>
          <p className="text-muted-foreground">
            Faça login para acessar a exchange e converter suas moedas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00FF91] to-white bg-clip-text text-transparent">
              Exchange Rioz Coin
            </h1>
            <p className="text-muted-foreground mt-1">
              Converta suas moedas com segurança e transparência
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Exchange Widget */}
        <div className="xl:col-span-1 space-y-6">
          <ExchangeWidget />
          <BalanceDonutChart />
        </div>
        
        {/* Functional Order Book */}
        <div className="xl:col-span-3">
          <FunctionalOrderBook />
        </div>
      </div>

      {/* History Section */}
      <div className="mt-8">
        <ExchangeHistory />
      </div>
    </div>
  );
};

export default Exchange;