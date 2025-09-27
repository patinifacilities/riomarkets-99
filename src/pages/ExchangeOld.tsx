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

const ExchangeOld = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const { toast } = useToast();
  
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState('');
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
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    const side = activeTab === 'buy' ? 'buy_rioz' : 'sell_rioz';
    
    try {
      await performExchange(side, numAmount, 'RIOZ');
      setAmount('');
      setLimitPrice('');
      
      toast({
        title: "Transação realizada",
        description: `${activeTab === 'buy' ? 'Compra' : 'Venda'} de ${numAmount} RIOZ realizada com sucesso.`,
      });
      
      track('exchange_completed', { 
        side, 
        amount: numAmount, 
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
    const numAmount = parseFloat(amount);
    const price = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : rate.price;
    return numAmount * price;
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Saldos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">RIOZ</span>
              <span className="font-semibold">{balance?.rioz_balance || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
              <span className="text-sm text-muted-foreground">BRL</span>
              <span className="font-semibold">R$ {(balance?.brl_balance || 0).toFixed(2)}</span>
            </div>
            
            {rate && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Taxa atual</span>
                  <div className="text-right">
                    <div className="font-semibold">R$ {rate.price.toFixed(4)}</div>
                    <div className={`text-xs flex items-center gap-1 ${
                      rate.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {rate.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(rate.change24h).toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trading Interface */}
        <Card className="lg:col-span-2">
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
                  Comprar
                </TabsTrigger>
                <TabsTrigger value="sell" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
                  Vender
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="buy" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="buy-amount">Quantidade RIOZ</Label>
                    <Input
                      id="buy-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
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
                  <div>
                    <Label htmlFor="sell-amount">Quantidade RIOZ</Label>
                    <Input
                      id="sell-amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  
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
                    className="w-full bg-red-500 hover:bg-red-600"
                  >
                    Vender RIOZ
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExchangeOld;