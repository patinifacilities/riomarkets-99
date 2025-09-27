import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Download, Calculator, Users, DollarSign } from 'lucide-react';
import ExportCSVButton from '@/components/ui/export-csv-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useMarket } from '@/hooks/useMarkets';
import { useMarketPool } from '@/hooks/useMarketPoolsNew';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import PoolProgressBar from '@/components/markets/PoolProgressBar';

interface OrderWithUser {
  id: string;
  user_id: string;
  opcao_escolhida: string;
  quantidade_moeda: number;
  preco: number;
  status: string;
  created_at: string;
  user_name?: string;
}

interface TransactionWithUser {
  id: string;
  user_id: string;
  tipo: string;
  valor: number;
  descricao: string;
  created_at: string;
  user_name?: string;
}

const MarketAudit = () => {
  const { id } = useParams<{ id: string }>();
  const { data: market, isLoading: marketLoading } = useMarket(id || '');
  const { data: pool } = useMarketPool(id || '');

  // Fetch orders for this market
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['market-orders', id],
    queryFn: async (): Promise<OrderWithUser[]> => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('market_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user names separately
      const ordersWithUsers = await Promise.all(
        (data || []).map(async (order) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', order.user_id)
            .maybeSingle();
          
          return {
            ...order,
            user_name: profile?.nome || 'Usuário desconhecido'
          };
        })
      );
      
      return ordersWithUsers;
    },
    enabled: !!id,
  });

  // Fetch transactions related to this market
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['market-transactions', id],
    queryFn: async (): Promise<TransactionWithUser[]> => {
      if (!id || !market) return [];
      
      const { data, error } = await supabase
        .from('wallet_transactions')
        .select('*')
        .ilike('descricao', `%${market.titulo}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch user names separately
      const transactionsWithUsers = await Promise.all(
        (data || []).map(async (transaction) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', transaction.user_id)
            .maybeSingle();
          
          return {
            ...transaction,
            user_name: profile?.nome || 'Usuário desconhecido'
          };
        })
      );
      
      return transactionsWithUsers;
    },
    enabled: !!id && !!market,
  });

  // Fetch result if market is liquidated
  const { data: result } = useQuery({
    queryKey: ['market-result', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .eq('market_id', id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (marketLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando auditoria...</p>
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Mercado não encontrado</h1>
        <Link to="/admin">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Admin
          </Button>
        </Link>
      </div>
    );
  }

  const exportToCSV = () => {
    if (!orders) return;
    
    const csvContent = [
      ['Nome', 'Opção', 'Quantidade', 'Recompensa', 'Status', 'Data'].join(','),
      ...orders.map(order => [
        order.user_name,
        order.opcao_escolhida,
        order.quantidade_moeda,
        order.preco,
        order.status,
        new Date(order.created_at).toLocaleDateString('pt-BR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${market.titulo.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const totalBets = orders?.length || 0;
  const activeBets = orders?.filter(o => o.status === 'ativa').length || 0;
  const winningBets = orders?.filter(o => o.status === 'ganha').length || 0;
  const losingBets = orders?.filter(o => o.status === 'perdida').length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Admin
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Auditoria do Mercado</h1>
              <p className="text-muted-foreground">{market.titulo}</p>
            </div>
          </div>
          <Button onClick={exportToCSV} disabled={!orders || orders.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* Market Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Análises</p>
                  <p className="text-2xl font-bold">{totalBets}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">Pool Total</p>
                  <p className="text-2xl font-bold">{pool?.total_pool || 0} Rioz Coin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Taxa Estimada</p>
                  <p className="text-2xl font-bold">
                    {pool?.projected_fee || 0} Rioz Coin
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge className={`
                  ${market.status === 'aberto' ? 'bg-success-muted text-success' : 
                    market.status === 'fechado' ? 'bg-muted text-muted-foreground' : 
                    'bg-accent-muted text-accent'}
                `}>
                  {market.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pool Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Distribuição do Pool</CardTitle>
          </CardHeader>
          <CardContent>
            <PoolProgressBar 
              simPercent={pool?.percent_sim || 0} 
              naoPercent={pool?.percent_nao || 0}
            />
          </CardContent>
        </Card>

        {/* Result Info (if liquidated) */}
        {result && (
          <Card className="mb-8 border-accent/50">
            <CardHeader>
              <CardTitle className="text-accent">Resultado da Liquidação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Opção Vencedora</p>
                  <p className="text-xl font-bold text-success">{result.resultado_vencedor.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Liquidação</p>
                  <p className="text-lg">{new Date(result.data_liquidacao).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className="bg-success-muted text-success">
                    {result.tx_executada ? 'Executada' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Orders Table */}
        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico de Análises</CardTitle>
            <ExportCSVButton
              data={orders || []}
              filename={`analises_mercado_${id}`}
              headers={['User Name', 'Opção Escolhida', 'Quantidade Moeda', 'Preço', 'Status', 'Created At']}
            />
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-muted-foreground">Carregando análises...</p>
              </div>
            ) : orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Opção</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Recompensa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.user_name}</TableCell>
                      <TableCell>
                        <Badge className={`
                          ${order.opcao_escolhida === 'sim' ? 'bg-success-muted text-success' : 'bg-danger-muted text-danger'}
                        `}>
                          {order.opcao_escolhida.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.quantidade_moeda} Rioz Coin</TableCell>
                      <TableCell>{order.preco.toFixed(2)}x</TableCell>
                      <TableCell>
                        <Badge className={`
                          ${order.status === 'ativa' ? 'bg-muted text-muted-foreground' : 
                            order.status === 'ganha' ? 'bg-success-muted text-success' : 
                            'bg-danger-muted text-danger'}
                        `}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(order.created_at).toLocaleTimeString('pt-BR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma análise encontrada para este mercado.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        {transactions && transactions.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transações Relacionadas</CardTitle>
              <ExportCSVButton
                data={transactions || []}
                filename={`transacoes_mercado_${id}`}
                headers={['User Name', 'Tipo', 'Valor', 'Descrição', 'Created At']}
              />
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="text-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-muted-foreground">Carregando transações...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.user_name}</TableCell>
                        <TableCell>
                          <Badge className={`
                            ${transaction.tipo === 'credito' ? 'bg-success-muted text-success' : 'bg-danger-muted text-danger'}
                          `}>
                            {transaction.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={transaction.tipo === 'credito' ? 'text-success' : 'text-danger'}>
                            {transaction.tipo === 'credito' ? '+' : '-'}{transaction.valor} Rioz Coin
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{transaction.descricao}</TableCell>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarketAudit;