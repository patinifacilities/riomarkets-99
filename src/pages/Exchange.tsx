import { useAuth } from '@/hooks/useAuth';
import { useBalance } from '@/hooks/useBalance';
import { ExchangeWidget } from '@/components/exchange/ExchangeWidget';
import { BalancesCard } from '@/components/exchange/BalancesCard';
import { TopMarketsCard } from '@/components/exchange/TopMarketsCard';
import { RatesTicker } from '@/components/exchange/RatesTicker';
import { ExchangeHistory } from '@/components/exchange/ExchangeHistory';
import { toast } from "sonner";

export default function Exchange() {
  const { user } = useAuth();
  const { riozBalance, brlBalance, refetch: refetchBalance } = useBalance();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Acesso Restrito</h1>
          <p className="text-muted-foreground">Você precisa estar logado para acessar o exchange.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold">Exchange Rio Markets</h1>
            <p className="text-muted-foreground">
              Converta suas moedas com segurança e transparência
            </p>
          </div>

          {/* Rates Ticker */}
          <RatesTicker />

          {/* Main Exchange Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ExchangeWidget />
            </div>

            {/* Right Column - Balances and Top Markets */}
            <div className="space-y-6">
              <BalancesCard />
              <TopMarketsCard />
            </div>
          </div>

          {/* Exchange History */}
          <ExchangeHistory />
        </div>
      </div>
    </div>
  );
}