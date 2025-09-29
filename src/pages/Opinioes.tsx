import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  X,
  CheckCircle 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OpenOrder {
  id: string;
  market_id: string;
  opcao_escolhida: string;
  quantidade_moeda: number;
  preco: number;
  created_at: string;
  market_title: string;
  market_categoria: string;
  market_status: string;
  market_end_date: string;
}

const Opinioes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OpenOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchOpenOrders();
    }
  }, [user?.id]);

  const fetchOpenOrders = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          market_id,
          opcao_escolhida,
          quantidade_moeda,
          preco,
          created_at,
          markets!inner(
            titulo,
            categoria,
            status,
            end_date
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'ativa')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: OpenOrder[] = (data || []).map(order => ({
        id: order.id,
        market_id: order.market_id,
        opcao_escolhida: order.opcao_escolhida,
        quantidade_moeda: order.quantidade_moeda,
        preco: order.preco,
        created_at: order.created_at,
        market_title: (order.markets as any).titulo,
        market_categoria: (order.markets as any).categoria,
        market_status: (order.markets as any).status,
        market_end_date: (order.markets as any).end_date,
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar suas opiniões",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelada' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Opinião cancelada",
        description: "Sua opinião foi cancelada com sucesso",
      });

      fetchOpenOrders();
    } catch (error) {
      console.error('Error canceling order:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar a opinião",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'economia': 'bg-success-muted text-success',
      'esportes': 'bg-accent-muted text-accent',
      'política': 'bg-danger-muted text-danger',
      'clima': 'bg-primary-glow/20 text-primary'
    };
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'aberto': 'bg-success-muted text-success',
      'fechado': 'bg-muted text-muted-foreground',
      'liquidado': 'bg-accent-muted text-accent'
    };
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const getOptionColor = (option: string) => {
    return option.toLowerCase() === 'sim' ? 'text-[#00FF91]' : 'text-[#FF1493]';
  };

  const getDaysUntilEnd = (endDate: string): number => {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando suas opiniões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <MessageSquare className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Minhas Opiniões</h1>
        <Badge variant="outline" className="ml-auto">
          {orders.length} em aberto
        </Badge>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Nenhuma opinião em aberto</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Você ainda não tem nenhuma opinião ativa. Explore os mercados disponíveis e comece a opinar!
          </p>
          <Button onClick={() => navigate('/')} className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Explorar Mercados
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const daysLeft = getDaysUntilEnd(order.market_end_date);
            const estimatedReturn = order.quantidade_moeda * order.preco;
            const estimatedProfit = estimatedReturn - order.quantidade_moeda;

            return (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="space-y-2">
                          <Badge className={getCategoryColor(order.market_categoria)}>
                            {order.market_categoria}
                          </Badge>
                          <Badge className={getStatusColor(order.market_status)}>
                            {order.market_status}
                          </Badge>
                        </div>
                        <div className="flex-1">
                          <Link 
                            to={`/market/${order.market_id}`}
                            className="text-lg font-semibold hover:text-primary transition-colors block line-clamp-2"
                          >
                            {order.market_title}
                          </Link>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Encerrando em breve'}
                            </div>
                            <div>
                              Opinado em: {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Opinion Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/20 rounded-lg">
                        <div>
                          <div className="text-sm text-muted-foreground">Opinião</div>
                          <div className={`text-lg font-bold ${getOptionColor(order.opcao_escolhida)}`}>
                            {order.opcao_escolhida.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Valor Investido</div>
                          <div className="text-lg font-semibold">
                            {order.quantidade_moeda.toLocaleString()} RIOZ
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Multiplicador</div>
                          <div className="text-lg font-semibold">
                            {order.preco.toFixed(2)}x
                          </div>
                        </div>
                      </div>

                      {/* Potential Return */}
                      <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg border border-success/20">
                        <div>
                          <div className="text-sm text-muted-foreground">Retorno Potencial</div>
                          <div className="text-lg font-semibold text-success">
                            {estimatedReturn.toLocaleString()} RIOZ
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Lucro Potencial</div>
                          <div className="text-lg font-semibold text-success">
                            +{estimatedProfit.toLocaleString()} RIOZ
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      <Link to={`/market/${order.market_id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Ver Mercado
                        </Button>
                      </Link>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleCancelOrder(order.id)}
                        className="w-full"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Opinioes;