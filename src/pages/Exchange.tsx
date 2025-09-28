import { useEffect } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { useOrderBookStore } from '@/stores/useOrderBookStore';
import { ExchangeWidget } from '@/components/exchange/ExchangeWidget';
import { LimitOrderWidget } from '@/components/exchange/LimitOrderWidget';
import { FunctionalOrderBook } from '@/components/exchange/FunctionalOrderBook';
import { BalancesCard } from '@/components/exchange/BalancesCard';
import { RatesTicker } from '@/components/exchange/RatesTicker';
import { ExchangeHistory } from '@/components/exchange/ExchangeHistory';
import { ActiveOrdersList } from '@/components/exchange/ActiveOrdersList';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const Exchange = () => {
  const { fetchRate, fetchBalance, subscribeToRateUpdates } = useExchangeStore();
  const { startRealTimeUpdates } = useOrderBookStore();

  useEffect(() => {
    // Initialize data
    fetchRate();
    fetchBalance();

    // Set up real-time updates
    const unsubscribeRates = subscribeToRateUpdates();
    const unsubscribeOrderBook = startRealTimeUpdates();

    return () => {
      unsubscribeRates();
      unsubscribeOrderBook();
    };
  }, [fetchRate, fetchBalance, subscribeToRateUpdates, startRealTimeUpdates]);

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Exchange RIOZ/BRL</h1>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Converta entre RIOZ e Reais brasileiros com taxas competitivas
          </p>
        </div>

        {/* Rates Ticker */}
        <RatesTicker />

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-8">
          {/* Left Column - Trading Widgets */}
          <div className="xl:col-span-4 space-y-6">
            <BalancesCard />
            
            <Tabs defaultValue="market" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="market">Mercado</TabsTrigger>
                <TabsTrigger value="limit">Limite</TabsTrigger>
              </TabsList>
              <TabsContent value="market">
                <ExchangeWidget />
              </TabsContent>
              <TabsContent value="limit">
                <LimitOrderWidget side="buy_rioz" />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center Column - Order Book */}
          <div className="xl:col-span-4">
            <FunctionalOrderBook />
          </div>

          {/* Right Column - History & Orders */}
          <div className="xl:col-span-4 space-y-6">
            <ActiveOrdersList />
            <ExchangeHistory />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exchange;