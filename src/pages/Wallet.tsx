import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, TrendingDown, Users, Plus, ArrowRightLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWalletTransactions, useUserOrders } from '@/hooks/useWallet';
import { useMarkets } from '@/hooks/useMarkets';
import { AddBrlModal } from '@/components/exchange/AddBrlModal';
import TransactionItem from '@/components/wallet/TransactionItem';
import OrderItem from '@/components/wallet/OrderItem';
import ExportCSVButton from '@/components/ui/export-csv-button';

const WalletPage = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { data: transactions, isLoading: loadingTransactions } = useWalletTransactions(user?.id);
  const { data: orders, isLoading: loadingOrders } = useUserOrders(user?.id);
  const { data: markets } = useMarkets();
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Calculate totals
  const totalCredits = transactions?.filter(t => t.tipo === 'credito').reduce((sum, t) => sum + t.valor, 0) || 0;
  const totalDebits = transactions?.filter(t => t.tipo === 'debito').reduce((sum, t) => sum + t.valor, 0) || 0;
  const currentBalance = profile?.saldo_moeda || 0;
  const totalInOrders = orders?.filter(o => o.status === 'ativa').reduce((sum, o) => sum + o.quantidade_moeda, 0) || 0;

  // Sort all orders by date
  const allOrders = orders?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  // Calculate global pool data (mock data for now)
  const globalPoolSim = 65000;
  const globalPoolNao = 35000;
  const totalPool = globalPoolSim + globalPoolNao;
  const simPercent = totalPool > 0 ? (globalPoolSim / totalPool) * 100 : 50;
  const naoPercent = totalPool > 0 ? (globalPoolNao / totalPool) * 100 : 50;

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Wallet className="w-8 h-8" />
            Minha Carteira
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus fundos e acompanhe suas transações
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-primary">
                    {currentBalance.toLocaleString()} RZ
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-accent/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Ordens Ativas</p>
                  <p className="text-2xl font-bold text-accent">
                    {totalInOrders.toLocaleString()} RZ
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card border-success/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Movimentação Total</p>
                  <p className="text-2xl font-bold text-success">
                    {(totalCredits - totalDebits).toLocaleString()} RZ
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Global Pool Status */}
        <Card className="bg-gradient-card border-border/50 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Status do Pool Global de Predições
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-[#00FF91]/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Pool SIM</div>
                <div className="text-xl font-bold text-[#00FF91]">{simPercent.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{globalPoolSim.toLocaleString()} RZ</div>
              </div>
              
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Pool Total</div>
                <div className="text-xl font-bold text-primary">{totalPool.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Rioz Coin</div>
              </div>
              
              <div className="text-center p-4 bg-[#FF1493]/10 rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Pool NÃO</div>
                <div className="text-xl font-bold text-[#FF1493]">{naoPercent.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">{globalPoolNao.toLocaleString()} RZ</div>
              </div>
            </div>

            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
              <p className="text-sm text-danger font-medium mb-2">⚠️ Aviso sobre Taxa de Liquidação</p>
              <p className="text-xs text-muted-foreground">
                20% do pool perdedor será destinado à manutenção da plataforma quando os mercados forem liquidados.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                className="bg-[#00FF91] hover:bg-[#00FF91]/90 text-black"
                onClick={() => {/* Handle SIM action */}}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Dar Opinião SIM
              </Button>
              <Button 
                className="bg-[#FF1493] hover:bg-[#FF1493]/90 text-white"
                onClick={() => {/* Handle NÃO action */}}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Dar Opinião NÃO
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transaction History */}
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Histórico de Transações</CardTitle>
                <ExportCSVButton 
                  data={transactions || []}
                  filename="transacoes"
                  headers={['ID', 'Tipo', 'Valor', 'Descrição']}
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
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
          <Card className="bg-gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Histórico de Ordens</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingOrders ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/20 rounded animate-pulse" />
                  ))}
                </div>
              ) : allOrders.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {allOrders.map((order) => {
                    const market = markets?.find(m => m.id === order.market_id);
                    return (
                      <OrderItem key={order.id} order={order} market={market} />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma ordem encontrada</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deposit and Withdraw Buttons */}
        <div className="flex gap-4 mb-6">
          <Button 
            onClick={() => setShowDepositModal(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Depositar
          </Button>
          <Button 
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Sacar
          </Button>
        </div>

        {/* Add BRL Modal */}
        <AddBrlModal 
          open={showDepositModal} 
          onOpenChange={setShowDepositModal}
        />
      </div>
    </div>
  );
};

export default WalletPage;