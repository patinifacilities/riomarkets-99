import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Users, Plus, ArrowRightLeft, DollarSign, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWalletTransactions, useUserOrders } from '@/hooks/useWallet';
import { useMarkets } from '@/hooks/useMarkets';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { AddBrlModal } from '@/components/exchange/AddBrlModal';
import { WithdrawModal } from '@/components/wallet/WithdrawModal';
import { CancelBetModal } from '@/components/wallet/CancelBetModal';
import { OrderHistoryCard } from '@/components/wallet/OrderHistoryCard';
import TransactionItem from '@/components/wallet/TransactionItem';
import OrderItem from '@/components/wallet/OrderItem';
import ExportCSVButton from '@/components/ui/export-csv-button';

const WalletPage = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { data: transactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useWalletTransactions(user?.id);
  const { data: orders, isLoading: loadingOrders } = useUserOrders(user?.id);
  const { data: markets } = useMarkets();
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

  // Calculate totals - Use real balance from exchange store
  const totalCredits = transactions?.filter(t => t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0) || 0;
  const totalDebits = transactions?.filter(t => t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0) || 0;
  const currentBalance = balance?.rioz_balance || profile?.saldo_moeda || 0;
  const brlBalance = balance?.brl_balance || 0;
  const totalInOrders = orders?.filter(o => o.status === 'ativa').reduce((sum, o) => sum + o.quantidade_moeda, 0) || 0;

  // Sort orders: active first, then by date
  const allOrders = orders?.sort((a, b) => {
    // Active orders first
    if (a.status === 'ativa' && b.status !== 'ativa') return -1;
    if (b.status === 'ativa' && a.status !== 'ativa') return 1;
    
    // Then by date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  }) || [];

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
          
          {/* No action buttons */}
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
           <Card className="bg-secondary-glass border-primary/20">
             <CardContent className="p-6">
               <div className="flex items-center justify-between">
                 <div>
                   <p className="text-sm text-muted-foreground">Saldo RIOZ Coin</p>
                   <div className="flex items-center gap-2">
                     <p className="text-2xl font-bold text-white">
                       {(profile?.saldo_moeda || 0).toLocaleString('pt-BR')} RZ
                     </p>
                     {/* Balance change arrows - you can implement logic to track changes */}
                     <TrendingUp className="w-5 h-5" style={{ color: '#00ff90' }} />
                   </div>
                 </div>
                 <Wallet className="w-8 h-8 text-white" />
               </div>
             </CardContent>
           </Card>

          <Card className="bg-secondary-glass border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Ordens Ativas</p>
                  <p className="text-2xl font-bold text-white">
                    {(totalInOrders || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RZ
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-secondary-glass border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo em R$/BRL</p>
                  <p className="text-2xl font-bold text-white">
                    R$ {(brlBalance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction History */}
          <Card className="bg-secondary-glass border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Histórico de Transações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="bg-card">
              {loadingTransactions ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-secondary-glass rounded animate-pulse" />
                  ))}
                </div>
               ) : transactions && transactions.length > 0 ? (
                 <div className="space-y-3 max-h-[500px] overflow-y-auto">
                   {transactions.map((transaction) => (
                     <TransactionItem key={transaction.id} transaction={transaction} />
                   ))}
                 </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma transação encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order History */}
          <OrderHistoryCard onRefresh={() => {
            refetchProfile();
            refetchTransactions();
            fetchBalance();
          }} />
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