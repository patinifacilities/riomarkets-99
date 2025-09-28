import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowRightLeft, Wallet, Loader2, TrendingUp, Flame, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMarkets } from '@/hooks/useMarkets';
import { useMarketStats } from '@/hooks/useMarketStats';

const Exchange = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { data: markets } = useMarkets();
  const { toast } = useToast();
  
  const [brlBalance, setBrlBalance] = useState(0);
  const [riozBalance, setRiozBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [sliderPercent, setSliderPercent] = useState([0]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [showNotification, setShowNotification] = useState(false);

  // Buscar saldos ao carregar
  useEffect(() => {
    if (user?.id) {
      fetchBalances();
    }
  }, [user?.id]);

  const fetchBalances = async () => {
    if (!user?.id) return;
    
    try {
      // Buscar saldo BRL
      const { data: balanceData } = await supabase
        .from('balances')
        .select('brl_balance')
        .eq('user_id', user.id)
        .single();

      // Buscar saldo RIOZ
      const { data: profileData } = await supabase
        .from('profiles')
        .select('saldo_moeda')
        .eq('id', user.id)
        .single();

      setBrlBalance(balanceData?.brl_balance || 0);
      setRiozBalance(profileData?.saldo_moeda || 0);
    } catch (error) {
      console.error('Erro ao buscar saldos:', error);
    }
  };

  const handleExchange = async () => {
    if (!user?.id || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    const feeRate = 0.01; // 1% de taxa
    const fee = amountNum * feeRate;
    
    // New validation logic - should always allow if using calculated max amount
    if (activeTab === 'buy') {
      const totalCost = amountNum + fee;
      if (brlBalance < totalCost) {
        toast({
          title: "Erro",
          description: "Saldo BRL insuficiente (incluindo taxa de 1%)",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (riozBalance < amountNum) {
        toast({
          title: "Erro", 
          description: "Saldo RIOZ insuficiente",
          variant: "destructive",
        });
        return;
      }
    }

    setLoading(true);
    
    try {
      if (activeTab === 'buy') {
        // Comprar RIOZ com BRL (descontando taxa)
        const totalCost = amountNum + fee;
        const newBrlBalance = brlBalance - totalCost;
        const newRiozBalance = riozBalance + amountNum;
        
        // Atualizar saldos
        await supabase.from('balances').update({ brl_balance: newBrlBalance }).eq('user_id', user.id);
        await supabase.from('profiles').update({ saldo_moeda: newRiozBalance }).eq('id', user.id);
        
        // Log da receita de taxa em R$ (convertendo de RZ para R$)
        await supabase.from('wallet_transactions').insert({
          id: 'fee_conversion_' + Date.now(),
          user_id: user.id,
          tipo: 'credito',
          valor: Math.round(fee * 100), // Converter para centavos e armazenar como R$
          descricao: 'Receita - Taxa de conversão (1%) - Compra RIOZ'
        });
        
        setBrlBalance(newBrlBalance);
        setRiozBalance(newRiozBalance);
        
        toast({
          title: "Compra realizada!",
          description: `Você comprou ${amountNum} RIOZ por R$ ${amountNum} (+ R$ ${fee.toFixed(2)} de taxa)`,
        });
      } else {
        // Vender RIOZ por BRL (descontando taxa)
        const totalReceived = amountNum - fee;
        const newBrlBalance = brlBalance + totalReceived;
        const newRiozBalance = riozBalance - amountNum;
        
        // Atualizar saldos
        await supabase.from('balances').update({ brl_balance: newBrlBalance }).eq('user_id', user.id);
        await supabase.from('profiles').update({ saldo_moeda: newRiozBalance }).eq('id', user.id);
        
        // Log da receita de taxa em R$ (convertendo de RZ para R$)
        await supabase.from('wallet_transactions').insert({
          id: 'fee_conversion_' + Date.now(),
          user_id: user.id,
          tipo: 'credito',
          valor: Math.round(fee * 100), // Converter para centavos e armazenar como R$
          descricao: 'Receita - Taxa de conversão (1%) - Venda RIOZ'
        });
        
        setBrlBalance(newBrlBalance);
        setRiozBalance(newRiozBalance);
        
        toast({
          title: "Venda realizada!",
          description: `Você vendeu ${amountNum} RIOZ e recebeu R$ ${totalReceived.toFixed(2)} (- R$ ${fee.toFixed(2)} de taxa)`,
        });
      }
      
      // Log da transação
      await supabase.from('exchange_orders').insert({
        user_id: user.id,
        side: activeTab === 'buy' ? 'buy_rioz' : 'sell_rioz',
        price_brl_per_rioz: 1.0,
        amount_rioz: amountNum,
        amount_brl: amountNum,
        fee_brl: activeTab === 'buy' ? fee : 0,
        fee_rioz: activeTab === 'sell' ? fee : 0,
        status: 'filled',
        filled_at: new Date().toISOString()
      });
      
      // Limpar formulário
      setAmount('');
      setSliderPercent([0]);
      
      // Mostrar animação de sucesso
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Atualizar profile para outros componentes
      await refetchProfile();
      
    } catch (error) {
      console.error('Erro na troca:', error);
      toast({
        title: "Erro na operação",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaxAmount = () => {
    // Calculate max amount after deducting fee
    const feeRate = 0.01; // 1% fee
    if (activeTab === 'buy') {
      // For buying: max amount is BRL balance divided by (1 + fee rate)
      return brlBalance / (1 + feeRate);
    } else {
      // For selling: max amount is RIOZ balance (fee is deducted from received BRL)
      return riozBalance;
    }
  };

  const handleSliderChange = (value: number[]) => {
    setSliderPercent(value);
    const maxAmount = getMaxAmount();
    const selectedAmount = (maxAmount * value[0]) / 100;
    setAmount(selectedAmount.toString());
  };

  const setPercentage = (percent: number) => {
    setSliderPercent([percent]);
    const maxAmount = getMaxAmount();
    const selectedAmount = (maxAmount * percent) / 100;
    setAmount(selectedAmount.toString());
  };

  // Get top volume markets for hot markets card - use static data to avoid changing when slider moves
  const topMarkets = markets 
    ? markets
        .filter(m => m.status === 'aberto')
        .map((market, index) => ({
          ...market,
          volume24h: [8500, 7200, 6300][index] || 5000 // Static values to prevent changes
        }))
        .slice(0, 3)
    : [];

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      {/* Success Notification */}
      {showNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-success text-success-foreground p-4 rounded-lg shadow-lg flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" />
            <span>Conversão realizada com sucesso!</span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Exchange RIOZ/BRL</h1>
          <p className="text-muted-foreground">
            Converta entre RIOZ e Reais brasileiros com taxa de 1%
          </p>
        </div>

        {/* Saldos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Seus Saldos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  R$ {brlBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-muted-foreground">Real Brasileiro</div>
              </div>
              <div className="text-center p-4 bg-secondary/10 rounded-lg">
                <div className="text-2xl font-bold text-secondary-foreground">
                  {riozBalance.toLocaleString('pt-BR')} RZ
                </div>
                <div className="text-sm text-muted-foreground">RIOZ Coin</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Interface de Troca */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="buy" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Comprar RIOZ
                  </TabsTrigger>
                  <TabsTrigger value="sell" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                    Vender RIOZ
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="buy" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Valor a converter (máximo: R$ {getMaxAmount().toLocaleString('pt-BR', { minimumFractionDigits: 2 })})</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        max={getMaxAmount()}
                        step="1"
                        min="0"
                      />
                    </div>

                    {/* Slider Percentage */}
                    <div className="space-y-3">
                      <Label>Selecionar percentual do saldo</Label>
                      <Slider
                        value={sliderPercent}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between gap-2 text-sm text-muted-foreground">
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <span
                            key={percent}
                            className="cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => setPercentage(percent)}
                          >
                            {percent}%
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Calculation Display - only show when amount > 0 */}
                    {(parseFloat(amount) > 0) && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Valor:</span>
                          <span className="font-medium">R$ {(parseFloat(amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Taxa (1%):</span>
                          <span className="font-medium text-success">- R$ {((parseFloat(amount) || 0) * 0.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span>Você recebe:</span>
                          <span className="font-medium text-success">{(parseFloat(amount) || 0).toLocaleString('pt-BR')} RZ</span>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleExchange}
                      disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > getMaxAmount()}
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                      )}
                      Comprar RIOZ
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="sell" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Quantidade RIOZ a vender (máximo: {getMaxAmount().toLocaleString('pt-BR')} RZ)</Label>
                      <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        max={getMaxAmount()}
                        step="1"
                        min="0"
                      />
                    </div>

                    {/* Slider Percentage */}
                    <div className="space-y-3">
                      <Label>Selecionar percentual do saldo</Label>
                      <Slider
                        value={sliderPercent}
                        onValueChange={handleSliderChange}
                        max={100}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between gap-2 text-sm text-muted-foreground">
                        {[0, 25, 50, 75, 100].map((percent) => (
                          <span
                            key={percent}
                            className="cursor-pointer hover:text-foreground transition-colors"
                            onClick={() => setPercentage(percent)}
                          >
                            {percent}%
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Calculation Display - only show when amount > 0 */}
                    {(parseFloat(amount) > 0) && (
                      <div className="bg-success/10 border border-success/20 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Você vende:</span>
                          <span className="font-medium">{(parseFloat(amount) || 0).toLocaleString('pt-BR')} RZ</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Taxa (1%):</span>
                          <span className="font-medium text-success">- R$ {((parseFloat(amount) || 0) * 0.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t pt-2">
                          <span>Você recebe:</span>
                          <span className="font-medium text-success">R$ {((parseFloat(amount) || 0) - (parseFloat(amount) || 0) * 0.01).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleExchange}
                      disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > getMaxAmount()}
                      variant="destructive"
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                      )}
                      Vender RIOZ
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Disclaimer - only show when user interacts */}
              {(parseFloat(amount) > 0) && (
                <div className="mt-6 bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-success mb-1">
                        Uma taxa de <strong>1%</strong> é cobrada em todas as conversões. 
                        Para realizar análises na plataforma, é necessário ter saldo em RIOZ Coin.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hot Markets Mini Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-500" />
                Mercados Hot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topMarkets.length > 0 ? (
                  topMarkets.map((market, index) => (
                    <Card key={market.id} className="cursor-pointer hover:border-primary/50 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="destructive" className="text-xs animate-pulse">
                                HOT
                              </Badge>
                              {index === 0 && (
                                <TrendingUp className="h-4 w-4 text-success animate-bounce" />
                              )}
                            </div>
                            <h4 className="font-medium text-sm leading-tight mb-2">
                              {market.titulo}
                            </h4>
                            <div className="flex gap-2 mb-3">
                              <Button size="sm" className="bg-[#00ff90] hover:bg-[#00ff90]/90 text-black text-xs px-3 py-1 h-7">
                                SIM {market.odds?.sim?.toFixed(2)}x
                              </Button>
                              <Button size="sm" className="bg-[#ff2389] hover:bg-[#ff2389]/90 text-white text-xs px-3 py-1 h-7">
                                NÃO {(market.odds?.não || market.odds?.nao)?.toFixed(2)}x
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Volume 24h: {market.volume24h.toLocaleString()} RZ
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Flame className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum mercado ativo</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Exchange;