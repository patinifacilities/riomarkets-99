import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wallet, TrendingUp, TrendingDown, Users, Plus, Download, History, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useWalletTransactions, useUserOrders } from '@/hooks/useWallet';
import { useMarkets } from '@/hooks/useMarkets';
import { useMarketRewards } from '@/hooks/useMarketRewards';
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
  const { data: rewards } = useMarketRewards('sample-market-id');
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

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <WalletIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Carteira</h1>
          </div>
          <div className="flex gap-3 mb-4">
            <Button onClick={() => setDepositModalOpen(true)}>
              Adicionar Saldo
            </Button>
            <Button variant="outline" style={{ color: '#ff2389', borderColor: '#ff2389' }}>
              Sacar
            </Button>
          </div>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Gerencie seu saldo e acompanhe suas opiniões ativas
          </p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-primary border-primary/20">
            <CardContent className="p-8">
              <div className="text-center">
                <WalletIcon className="w-12 h-12 text-primary-foreground mx-auto mb-4" />
                <p className="text-primary-foreground/80 text-sm mb-2">Saldo Disponível</p>
                <p className="text-4xl font-bold text-primary-foreground mb-1">
                  {currentBalance.toLocaleString()}
                </p>
                <p className="text-primary-foreground/60 text-sm">Rioz Coin</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-8">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-accent mx-auto mb-4" />
                <p className="text-muted-foreground text-sm mb-2">Em Opiniões Ativas</p>
                <p className="text-3xl font-bold text-foreground mb-1">
                  {totalInActiveOrders.toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">Rioz Coin</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="p-8">
              <div className="text-center">
                <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm mb-2">Total Movimentado</p>
                <p className="text-3xl font-bold text-foreground mb-1">
                  {(totalCredits + totalDebits).toLocaleString()}
                </p>
                <p className="text-muted-foreground text-sm">Rioz Coin</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pool Atual Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Pool Atual Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-[#00FF91] text-2xl font-bold mb-1">
                  {globalPoolSim}% SIM
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(globalPoolTotal * globalPoolSim / 100).toLocaleString()} Rioz Coin
                </div>
              </div>
              <div className="text-center">
                <div className="text-[#FF1493] text-2xl font-bold mb-1">
                  {globalPoolNao}% NÃO
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(globalPoolTotal * globalPoolNao / 100).toLocaleString()} Rioz Coin
                </div>
              </div>
            </div>
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-4">
              <p className="text-sm text-danger font-medium mb-2">⚠️ Aviso sobre Taxa de Liquidação</p>
              <p className="text-xs text-muted-foreground">
                20% do pool perdedor será destinado à manutenção da plataforma quando os mercados forem liquidados.
              </p>
            </div>
          </CardContent>
        </Card>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transactions History */}
          <Card>
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
                  {allOrders.map((order) => (
                    <OrderItem key={order.id} order={order} markets={markets || []} />
                  ))}
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
      </div>

        {/* Add BRL Modal */}
        <AddBrlModal 
          open={showDepositModal} 
          onOpenChange={setShowDepositModal}
        />
    </div>
  );
};

export default WalletPage;