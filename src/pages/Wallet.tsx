import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWalletTransactions, useUserOrders } from '@/hooks/useWallet';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { AddBrlModal } from '@/components/exchange/AddBrlModal';
import { CancelBetModal } from '@/components/wallet/CancelBetModal';
import { OrderHistoryCard } from '@/components/wallet/OrderHistoryCard';
import { ExpandableRiozCard } from '@/components/wallet/ExpandableRiozCard';
import { BalanceDonutChart } from '@/components/exchange/BalanceDonutChart';
import { CompletedOrdersCard } from '@/components/wallet/CompletedOrdersCard';
import { RecentWinsCard } from '@/components/wallet/RecentWinsCard';

const WalletPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { data: transactions, refetch: refetchTransactions } = useWalletTransactions(user?.id);
  const { data: orders } = useUserOrders(user?.id);
  const { balance, fetchBalance } = useExchangeStore();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showCancelBetModal, setShowCancelBetModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user, fetchBalance]);

  useEffect(() => {
    // Refresh data when modals close
    if (!showDepositModal && user) {
      refetchProfile();
      refetchTransactions();
      fetchBalance();
    }
  }, [showDepositModal, user, refetchProfile, refetchTransactions, fetchBalance]);

  // Calculate totals - Use profile balance as primary source
  const currentBalance = profile?.saldo_moeda || 0;
  const brlBalance = balance?.brl_balance || 0;
  const totalInOrders = orders?.filter(o => o.status === 'ativa').reduce((sum, o) => sum + o.quantidade_moeda, 0) || 0;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acesso negado</h1>
        <p className="text-muted-foreground">Você precisa estar logado para acessar sua carteira.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Blocked User Warning */}
      {profile?.is_blocked && (
        <div className="bg-red-500 text-white px-4 py-3 text-center font-semibold">
          ⚠️ Sua conta está temporariamente bloqueada. Você não pode realizar saques no momento. Entre em contato com o suporte.
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6">
        {/* Mobile header - Show only on mobile */}
        <div className="md:hidden mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Wallet className="w-7 h-7" />
            Carteira
          </h1>
        </div>
        
        {/* Desktop header - Show only on desktop */}
        <div className="hidden md:flex mb-8 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Wallet className="w-8 h-8" />
              Carteira
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus fundos e acompanhe suas transações
            </p>
          </div>
          
          <Button
            onClick={() => navigate('/withdraw')}
            variant="default"
            size="sm"
            className="gap-2"
            disabled={profile?.is_blocked}
          >
            <DollarSign className="w-4 h-4" />
            Saque
          </Button>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Left Column - Balance Cards */}
          <div className="lg:col-span-2 space-y-4">
            {/* Expandable RIOZ Balance Card - Full Width */}
            <ExpandableRiozCard 
              currentBalance={currentBalance}
              totalInOrders={totalInOrders}
              brlBalance={brlBalance}
            />
            
            {/* Completed Orders - Full Width */}
            <CompletedOrdersCard />
            
            {/* Recent Wins - Full Width */}
            <RecentWinsCard />
          </div>
          
          {/* Right Column - Charts and History */}
          <div className="lg:col-span-1 space-y-4">
            {/* Balance Donut Chart - Show first on mobile */}
            <BalanceDonutChart />
            
            {/* Order History */}
            <OrderHistoryCard onRefresh={() => {
              refetchProfile();
              refetchTransactions();
              fetchBalance();
            }} />
          </div>
        </div>

        {/* Modals */}
        <AddBrlModal
          open={showDepositModal}
          onOpenChange={setShowDepositModal}
          onSuccess={() => {
            setShowDepositModal(false);
            refetchProfile();
            refetchTransactions();
            fetchBalance();
          }}
        />

        <CancelBetModal
          open={showCancelBetModal}
          onOpenChange={setShowCancelBetModal}
          orderId={selectedOrder?.id}
          orderAmount={selectedOrder?.quantidade_moeda}
          onConfirm={async () => {
            setShowCancelBetModal(false);
            setSelectedOrder(null);
            await refetchProfile();
            await refetchTransactions();
            fetchBalance();
          }}
        />
      </div>
    </div>
  );
};

export default WalletPage;