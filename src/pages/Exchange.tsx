import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowUpDown, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { track } from '@/lib/analytics';
import { BalancesCard } from '@/components/exchange/BalancesCard';
import { TradeSlider } from '@/components/exchange/TradeSlider';
import { ConvertModal } from '@/components/exchange/ConvertModal';
import { supabase } from '@/integrations/supabase/client';

const Exchange = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  const { rate, balance, fetchRate, fetchBalance, performExchange } = useExchangeStore();
  
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [amount, setAmount] = useState(0);
  const [limitPrice, setLimitPrice] = useState('');
  const [orderBookData, setOrderBookData] = useState<any[]>([]);
  const [convertModalOpen, setConvertModalOpen] = useState(false);

  useEffect(() => {
    fetchRate();
    fetchBalance();
    fetchOrderBook();
    
    // Listen for convert modal trigger
    const handleOpenConvertModal = () => {
      setConvertModalOpen(true);
    };
    
    window.addEventListener('openConvertModal', handleOpenConvertModal);
    
    return () => {
      window.removeEventListener('openConvertModal', handleOpenConvertModal);
    };
  }, []);

  const fetchOrderBook = async () => {
    try {
      const { data } = await supabase
        .from('exchange_order_book')
        .select('*')
        .eq('status', 'active')
        .order('price_brl_per_rioz', { ascending: false });
      
      setOrderBookData(data || []);
    } catch (error) {
      console.error('Failed to fetch order book:', error);
    }
  };

  const handleTrade = async (side: 'buy' | 'sell') => {
    if (!user?.id || amount <= 0) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado e inserir um valor válido",
        variant: "destructive",
      });
      return;
    }

    try {
      if (orderType === 'market') {
        if (side === 'buy') {
          // Find cheapest sell orders to match
          const availableSellOrders = orderBookData
            .filter(order => order.side === 'sell')
            .sort((a, b) => a.price_brl_per_rioz - b.price_brl_per_rioz);
          
          let remainingAmount = amount;
          let totalCost = 0;
          
          // Calculate if we can fulfill the order
          for (const order of availableSellOrders) {
            const amountToTake = Math.min(remainingAmount, order.remaining_amount);
            totalCost += amountToTake * order.price_brl_per_rioz;
            remainingAmount -= amountToTake;
            if (remainingAmount <= 0) break;
          }
          
          if (remainingAmount > 0) {
            toast({
              title: "Erro",
              description: "Não há ordens de venda suficientes para completar sua compra",
              variant: "destructive",
            });
            return;
          }

          // Check if user has enough BRL balance
          if ((balance?.brl_balance || 0) < totalCost) {
            toast({
              title: "Erro", 
              description: "Saldo BRL insuficiente",
              variant: "destructive",
            });
            return;
          }

          // Execute the market buy order
          await performExchange('buy_rioz', amount, 'RIOZ');
          
          // Refresh profile to update RIOZ balance
          await refetchProfile();
        } else {
          // Find highest buy orders to match
          const availableBuyOrders = orderBookData
            .filter(order => order.side === 'buy')
            .sort((a, b) => b.price_brl_per_rioz - a.price_brl_per_rioz);
          
          let remainingAmount = amount;
          
          // Calculate if we can fulfill the order
          for (const order of availableBuyOrders) {
            const amountToTake = Math.min(remainingAmount, order.remaining_amount);
            remainingAmount -= amountToTake;
            if (remainingAmount <= 0) break;
          }
          
          if (remainingAmount > 0) {
            toast({
              title: "Erro",
              description: "Não há ordens de compra suficientes para completar sua venda",
              variant: "destructive",
            });
            return;
          }

          // Check if user has enough RIOZ balance
          if ((balance?.rioz_balance || 0) < amount) {
            toast({
              title: "Erro",
              description: "Saldo RIOZ insuficiente", 
              variant: "destructive",
            });
            return;
          }

          // Execute the market sell order
          await performExchange('sell_rioz', amount, 'RIOZ');
          
          // Refresh profile to update RIOZ balance
          await refetchProfile();
        }
        
        // Refresh order book and balances
        await Promise.all([fetchOrderBook(), fetchBalance(), refetchProfile()]);
        
        toast({
          title: "Trade executado!",
          description: `${side === 'buy' ? 'Compra' : 'Venda'} realizada com sucesso.`,
        });
      } else {
        // Create limit order and update balance immediately
        const price = parseFloat(limitPrice) || rate?.price || 1;
        
        // Check balance before placing limit order
        if (side === 'buy') {
          const totalCost = amount * price;
          if ((balance?.brl_balance || 0) < totalCost) {
            toast({
              title: "Erro",
              description: "Saldo BRL insuficiente para criar a ordem",
              variant: "destructive",
            });
            return;
          }
          
          // Reserve BRL balance
          await supabase
            .from('balances')
            .update({ brl_balance: (balance?.brl_balance || 0) - totalCost })
            .eq('user_id', user.id);
        } else {
          if ((balance?.rioz_balance || 0) < amount) {
            toast({
              title: "Erro", 
              description: "Saldo RIOZ insuficiente para criar a ordem",
              variant: "destructive",
            });
            return;
          }
          
          // Reserve RIOZ balance
          await supabase
            .from('balances')
            .update({ rioz_balance: (balance?.rioz_balance || 0) - amount })
            .eq('user_id', user.id);
        }
        
        const { error } = await supabase
          .from('exchange_order_book')
          .insert({
            user_id: user.id,
            side,
            amount_rioz: amount,
            price_brl_per_rioz: price,
            remaining_amount: amount,
            order_type: 'limit'
          });

        if (error) throw error;

        // Refresh balances to show updated amounts
        await Promise.all([fetchBalance(), refetchProfile()]);

        toast({
          title: "Ordem criada!",
          description: `Ordem de ${side === 'buy' ? 'compra' : 'venda'} adicionada ao order book.`,
        });
        
        fetchOrderBook();
      }
      
      setAmount(0);
      setLimitPrice('');
    } catch (error) {
      toast({
        title: "Erro no trade",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };

  // Sort buy orders by price (highest first) and sell orders by price (lowest first)
  const buyOrders = orderBookData
    .filter(order => order.side === 'buy')
    .sort((a, b) => b.price_brl_per_rioz - a.price_brl_per_rioz)
    .slice(0, 10);
  
  const sellOrders = orderBookData
    .filter(order => order.side === 'sell') 
    .sort((a, b) => a.price_brl_per_rioz - b.price_brl_per_rioz)
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[1400px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Exchange RIOZ/BRL</h1>
          <p className="text-muted-foreground max-w-[65ch] mx-auto">
            Converta entre RIOZ e Reais brasileiros com taxas competitivas
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trading Interface */}
          <div className="space-y-6">
            <BalancesCard />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5" />
                  Trading Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Ordem</label>
                  <Select value={orderType} onValueChange={(value: 'market' | 'limit') => setOrderType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="market">Mercado</SelectItem>
                      <SelectItem value="limit">Limite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="data-[state=active]:bg-[#00ff90] data-[state=active]:text-black">
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
                          <label className="text-sm font-medium">Preço Limite (BRL por RIOZ)</label>
                          <input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            placeholder={`${rate?.price || 1}`}
                            className="w-full mt-2 px-3 py-2 border rounded-lg"
                            step="0.01"
                          />
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        {orderType === 'market' ? (
                          <>Taxa atual: R$ {rate?.price?.toFixed(4) || '1.0000'} por RIOZ</>
                        ) : (
                          <>Preço limite: R$ {limitPrice || rate?.price?.toFixed(4) || '1.0000'} por RIOZ</>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleTrade('buy')}
                      disabled={amount <= 0}
                      className="w-full bg-[#00ff90] hover:bg-[#00ff90]/90 text-black"
                    >
                      Comprar RIOZ
                    </Button>
                  </TabsContent>
                  
                  <TabsContent value="sell" className="space-y-4 mt-6">
                     <div className="space-y-4">
                       <TradeSlider
                         balance={profile?.saldo_moeda || 0}
                         currency="RIOZ"
                         price={rate?.price || 1}
                         onAmountChange={setAmount}
                         side="sell"
                       />
                      
                      {orderType === 'limit' && (
                        <div>
                          <label className="text-sm font-medium">Preço Limite (BRL por RIOZ)</label>
                          <input
                            type="number"
                            value={limitPrice}
                            onChange={(e) => setLimitPrice(e.target.value)}
                            placeholder={`${rate?.price || 1}`}
                            className="w-full mt-2 px-3 py-2 border rounded-lg"
                            step="0.01"
                          />
                        </div>
                      )}
                      
                      <div className="text-sm text-muted-foreground">
                        {orderType === 'market' ? (
                          <>Taxa atual: R$ {rate?.price?.toFixed(4) || '1.0000'} por RIOZ</>
                        ) : (
                          <>Preço limite: R$ {limitPrice || rate?.price?.toFixed(4) || '1.0000'} por RIOZ</>
                        )}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleTrade('sell')}
                      disabled={amount <= 0}
                      className="w-full bg-[#ff2389] hover:bg-[#ff2389]/90 text-white"
                    >
                      Vender RIOZ
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Order Book */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Order Book
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sell Orders (Ask) - Top */}
                  <div>
                    <h3 className="text-sm font-medium text-[#ff2389] mb-3">
                      Ordens de Venda (Ask)
                    </h3>
                    <div className="space-y-1 border border-[#ff2389]/20 rounded-lg p-3 bg-[#ff2389]/5">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground border-b border-border pb-1">
                        <span>Preço (BRL)</span>
                        <span>Quantidade (RIOZ)</span>
                        <span>Total (BRL)</span>
                      </div>
                      {sellOrders.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 text-xs">
                          Nenhuma ordem de venda
                        </div>
                      ) : (
                        sellOrders.map((order, index) => (
                          <div 
                            key={order.id} 
                            className="flex justify-between text-xs py-1 hover:bg-[#ff2389]/10 rounded px-2 cursor-pointer transition-colors"
                            style={{
                              backgroundColor: `rgba(255, 35, 137, ${0.05 + (index * 0.02)})`,
                            }}
                          >
                            <span className="text-[#ff2389] font-mono">
                              {order.price_brl_per_rioz.toFixed(4)}
                            </span>
                            <span className="text-foreground font-mono">
                              {order.remaining_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              {(order.remaining_amount * order.price_brl_per_rioz).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Current Price */}
                  <div className="text-center py-2 border-y border-border bg-card/50">
                    <div className="text-lg font-bold text-foreground">
                      R$ {rate?.price?.toFixed(4) || '1.0000'}
                    </div>
                    <div className="text-xs text-muted-foreground">Preço Atual</div>
                  </div>

                  {/* Buy Orders (Bid) - Bottom */}
                  <div>
                    <h3 className="text-sm font-medium text-[#00ff90] mb-3">
                      Ordens de Compra (Bid)
                    </h3>
                    <div className="space-y-1 border border-[#00ff90]/20 rounded-lg p-3 bg-[#00ff90]/5">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground border-b border-border pb-1">
                        <span>Preço (BRL)</span>
                        <span>Quantidade (RIOZ)</span>
                        <span>Total (BRL)</span>
                      </div>
                      {buyOrders.length === 0 ? (
                        <div className="text-center text-muted-foreground py-4 text-xs">
                          Nenhuma ordem de compra
                        </div>
                      ) : (
                        buyOrders.map((order, index) => (
                          <div 
                            key={order.id} 
                            className="flex justify-between text-xs py-1 hover:bg-[#00ff90]/10 rounded px-2 cursor-pointer transition-colors"
                            style={{
                              backgroundColor: `rgba(0, 255, 144, ${0.05 + (index * 0.02)})`,
                            }}
                          >
                            <span className="text-[#00ff90] font-mono">
                              {order.price_brl_per_rioz.toFixed(4)}
                            </span>
                            <span className="text-foreground font-mono">
                              {order.remaining_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-muted-foreground font-mono">
                              {(order.remaining_amount * order.price_brl_per_rioz).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Convert Modal */}
        <ConvertModal 
          open={convertModalOpen}
          onOpenChange={setConvertModalOpen}
          onSuccess={() => {
            fetchBalance();
            refetchProfile();
          }}
        />
      </div>
    </div>
  );
};

export default Exchange;