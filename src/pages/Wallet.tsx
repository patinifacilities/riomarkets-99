import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWalletTransactions, useUserOrders } from '@/hooks/useWallet';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { AddBrlModal } from '@/components/exchange/AddBrlModal';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import { CancelBetModal } from '@/components/wallet/CancelBetModal';
import { OrderHistoryCard } from '@/components/wallet/OrderHistoryCard';
import { ExpandableRiozCard } from '@/components/wallet/ExpandableRiozCard';
import { BalanceDonutChart } from '@/components/exchange/BalanceDonutChart';
import { CompletedOrdersCard } from '@/components/wallet/CompletedOrdersCard';
import { RecentWinsCard } from '@/components/wallet/RecentWinsCard';

const WalletPage = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { data: transactions, refetch: refetchTransactions } = useWalletTransactions(user?.id);
  const { data: orders } = useUserOrders(user?.id);
  const { balance, fetchBalance } = useExchangeStore();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCancelBetModal, setShowCancelBetModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchBalance();
    }
  }, [user, fetchBalance]);

  useEffect(() => {
    // Refresh data when modals close
    if (!showDepositModal && !showWithdrawModal && user) {
      refetchProfile();
      refetchTransactions();
      fetchBalance();
    }
  }, [showDepositModal, showWithdrawModal, user, refetchProfile, refetchTransactions, fetchBalance]);

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
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8 flex items-center justify-between">
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
            onClick={() => setShowWithdrawModal(true)}
            variant="default"
            size="sm"
            className="gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Saque
          </Button>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expandable RIOZ Balance Card */}
          <ExpandableRiozCard 
            currentBalance={currentBalance}
            totalInOrders={totalInOrders}
            brlBalance={brlBalance}
          />
          
          {/* Balance Donut Chart */}
          <BalanceDonutChart />
        </div>

        {/* Grid with Recent Wins and Order History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <RecentWinsCard />
          <OrderHistoryCard onRefresh={() => {
            refetchProfile();
            refetchTransactions();
            fetchBalance();
          }} />
        </div>

        {/* Completed Orders - Full Width */}
        <div className="mb-6">
          <CompletedOrdersCard />
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

        <WithdrawModal
          open={showWithdrawModal}
          onOpenChange={setShowWithdrawModal}
          onSuccess={() => {
            setShowWithdrawModal(false);
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