import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowUpDown, Wallet, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { useToast } from '@/hooks/use-toast';
import { track } from '@/lib/analytics';
import { BalancesCard } from '@/components/exchange/BalancesCard';
import { OrderBookWidget } from '@/components/exchange/OrderBookWidget';
import { TradeSlider } from '@/components/exchange/TradeSlider';

const ExchangeOld = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();
  
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState(0);
  const [limitPrice, setLimitPrice] = useState('');
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  
  const { 
    rate, 
    balance, 
    fetchRate, 
    fetchBalance, 
    performExchange 
  } = useExchangeStore();

  useEffect(() => {
    if (user) {
      fetchRate();
      fetchBalance();
    }
  }, [user, fetchRate, fetchBalance]);

  const handleExchange = async () => {
    if (!amount || amount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    const side = activeTab === 'buy' ? 'buy_rioz' : 'sell_rioz';
    
    try {
      await performExchange(side, amount, 'RIOZ');
      setAmount(0);
      setLimitPrice('');
      
      toast({
        title: "Transação realizada",
        description: `${activeTab === 'buy' ? 'Compra' : 'Venda'} de ${amount} RIOZ realizada com sucesso.`,
      });
      
      track('exchange_completed', { 
        side, 
        amount: amount, 
        order_type: orderType 
      });
    } catch (error) {
      toast({
        title: "Erro na transação",
        description: "Falha ao executar a operação. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const calculateTotal = () => {
    if (!amount || !rate) return 0;
    const price = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : rate.price;
    return amount * price;
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Exchange Rioz Coin</h1>
          <p className="text-muted-foreground">
            Faça login para acessar a exchange e converter suas moedas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#00FF91] to-white bg-clip-text text-transparent">
          Exchange Rioz Coin
        </h1>
        <p className="text-muted-foreground mt-1">
          Compre e venda RIOZ Coin com facilidade e segurança
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Order Book - Positioned above trading interface */}
        <div className="lg:col-span-3 space-y-4">
          <OrderBookWidget />
          
          {/* Trading Interface */}
          <Card data-exchange-widget>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Negociar</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={orderType} onValueChange={(value: 'market' | 'limit') => setOrderType(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Mercado</SelectItem>
                    <SelectItem value="limit">Limite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value: 'buy' | 'sell') => setActiveTab(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="buy" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                  Comprar RIOZ
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-[#ff2389] data-[state=active]:text-white">
                  Vender RIOZ
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <TradeSlider
                    balance={balance?.brl_balance || 0}
                    currency="BRL"
                    price={rate?.price || 1}
                    onAmountChange={setAmount}
                    side="buy"
                  />
                  
                  {orderType === 'limit' && (
                    <div>
                      <Label htmlFor="limit-price">Preço limite (BRL)</Label>
                      <Input
                        id="limit-price"
                        type="number"
                        placeholder="0.0000"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                  
                  <div className="p-3 bg-muted/20 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total estimado:</span>
                      <span>R$ {calculateTotal().toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxa (2%):</span>
                      <span>R$ {(calculateTotal() * 0.02).toFixed(4)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleExchange}
                    disabled={!amount}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Comprar RIOZ
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <TradeSlider
                    balance={balance?.rioz_balance || 0}
                    currency="RIOZ"
                    price={rate?.price || 1}
                    onAmountChange={setAmount}
                    side="sell"
                  />
                  
                  {orderType === 'limit' && (
                    <div>
                      <Label htmlFor="sell-limit-price">Preço limite (BRL)</Label>
                      <Input
                        id="sell-limit-price"
                        type="number"
                        placeholder="0.0000"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  )}
                  
                  <div className="p-3 bg-muted/20 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total estimado:</span>
                      <span>R$ {calculateTotal().toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Taxa (2%):</span>
                      <span>R$ {(calculateTotal() * 0.02).toFixed(4)}</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleExchange}
                    disabled={!amount}
                    className="w-full bg-[#ff2389] hover:bg-[#ff2389]/90"
                  >
                    Vender RIOZ
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        </div>

        {/* Balance Card - Right sidebar */}
        <div className="lg:col-span-1">
          <BalancesCard />
        </div>
      </div>
    </div>
  );
};

export default ExchangeOld;