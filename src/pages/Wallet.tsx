import { Wallet as WalletIcon, TrendingUp, TrendingDown, History, BarChart3, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import TransactionItem from '@/components/wallet/TransactionItem';
import OrderItem from '@/components/wallet/OrderItem';
import ExportCSVButton from '@/components/ui/export-csv-button';
import { useWalletTransactions, useUserOrders } from '@/hooks/useWallet';
import { useMarkets } from '@/hooks/useMarkets';
import { useAuth } from '@/hooks/useAuth';
import { useMarketRewards } from '@/hooks/useMarketRewards';

const Wallet = () => {
  const { user } = useAuth();
  const { data: transactions = [], isLoading: transactionsLoading } = useWalletTransactions(user?.id);
  const { data: orders = [], isLoading: ordersLoading } = useUserOrders(user?.id);
  const { data: markets = [] } = useMarkets();
  
  // Get a sample market for pool data (in a real app, this would be global pool data)
  const sampleMarket = markets[0];
  const { data: poolData } = useMarketRewards(sampleMarket?.id || '');
  
  // Calculate global pool percentages (mock data for demo)
  const globalPoolSim = 65;
  const globalPoolNao = 35;
  const globalPoolTotal = 150000;

  const totalCredits = transactions
    .filter(t => t.tipo === 'credito')
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDebits = transactions
    .filter(t => t.tipo === 'debito')
    .reduce((sum, t) => sum + t.valor, 0);

  const activeOrders = orders.filter(order => order.status === 'ativa');
  const totalInActiveOrders = activeOrders.reduce((sum, order) => sum + order.quantidade_moeda, 0);
  
  // All orders for complete history
  const allOrders = orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const currentBalance = totalCredits - totalDebits;

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <WalletIcon className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold">Carteira</h1>
          </div>
          <div className="flex gap-3 mb-4">
            <Button>
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
            <div className="text-center mt-4 pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Total do Pool: <span className="font-semibold text-foreground">{globalPoolTotal.toLocaleString()} Rioz Coin</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Liquidação Warning */}
        <div className="mb-6 p-4 rounded-lg border border-[#FF1493]/30 bg-[#FF1493]/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#FF1493]" />
            <p className="text-[#FF1493] text-sm font-medium">
              Taxa de liquidação: 20% do pool perdedor vai para a plataforma
            </p>
          </div>
        </div>

        {/* CTAs de Opinião */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Button 
            className="min-h-[56px] font-semibold text-lg"
            style={{ backgroundColor: '#00ff90', color: 'white' }}
            aria-label="Dar opinião apostando em SIM"
            onClick={() => window.location.href = '/'}
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Opinar SIM
          </Button>
          <Button 
            className="min-h-[56px] font-semibold text-lg"
            style={{ backgroundColor: '#ff2389', color: 'white' }}
            aria-label="Dar opinião apostando em NÃO"
            onClick={() => window.location.href = '/'}
          >
            <TrendingDown className="w-5 h-5 mr-2" />
            Opinar NÃO
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Transactions History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Histórico de Transações
              </CardTitle>
              <ExportCSVButton
                data={transactions}
                filename="historico_transacoes"
                headers={['Tipo', 'Valor', 'Descrição', 'Data']}
              />
            </CardHeader>
            <CardContent className="space-y-3">
              {transactionsLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                transactions.map(transaction => (
                  <TransactionItem key={transaction.id} transaction={transaction} />
                ))
              )}
            </CardContent>
          </Card>

          {/* All Orders History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Histórico de Opiniões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : allOrders.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingDown className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma análise encontrada</p>
                </div>
              ) : (
                allOrders.map(order => {
                  const market = markets.find(m => m.id === order.market_id);
                  return (
                    <OrderItem
                      key={order.id}
                      order={order}
                      market={market}
                    />
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Wallet;