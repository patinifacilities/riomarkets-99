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
import { ArrowRightLeft, Wallet, Loader2, TrendingUp, Flame, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMarkets } from '@/hooks/useMarkets';

const Exchange = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { data: markets } = useMarkets();
  const { toast } = useToast();
  
  const [brlBalance, setBrlBalance] = useState(0);
  const [riozBalance, setRiozBalance] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [amount, setAmount] = useState('');
  const [sliderPercent, setSliderPercent] = useState([0]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [showNotification, setShowNotification] = useState(false);

  // Buscar saldos ao carregar e quando refreshKey muda
  useEffect(() => {
    if (user?.id) {
      fetchBalances();
    }
  }, [user?.id, refreshKey]);

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
    
    // Simple validation for 1:1 conversion
    if (activeTab === 'buy') {
      if (brlBalance < amountNum) {
        toast({
          title: "Erro",
          description: "Saldo BRL insuficiente",
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
      // Call the simplified edge function
      const { data, error } = await supabase.functions.invoke('exchange-convert', {
        body: {
          operation: activeTab === 'buy' ? 'buy_rioz' : 'sell_rioz',
          amount: amountNum
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Erro na conversão');
      }

      // Update local states with response
      setBrlBalance(data.new_brl_balance);
      setRiozBalance(data.new_rioz_balance);
      
      toast({
        title: activeTab === 'buy' ? "Compra realizada!" : "Venda realizada!",
        description: activeTab === 'buy' 
          ? `Você comprou ${amountNum} RIOZ por R$ ${amountNum}`
          : `Você vendeu ${amountNum} RIOZ por R$ ${amountNum}`,
      });
      
      // Clear form
      setAmount('');
      setSliderPercent([0]);
      
      // Show success notification
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
      // Force refresh all balances
      await Promise.all([
        fetchBalances(),
        refetchProfile()
      ]);
      
      // Trigger refresh in other components
      setRefreshKey(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('forceProfileRefresh'));
      
    } catch (error) {
      console.error('Erro na troca:', error);
      toast({
        title: "Erro na operação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaxAmount = () => {
    // Simple max amount calculation for 1:1 conversion
    if (activeTab === 'buy') {
      return brlBalance; // Can convert all BRL to RIOZ
    } else {
      return riozBalance; // Can convert all RIOZ to BRL
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
            Converta entre RIOZ e Reais brasileiros com conversão 1:1
          </p>
        </div>

        {/* Interface de Troca Unificada */}
        <Card className="max-w-4xl mx-auto mb-8 bg-gradient-to-br from-card via-card-secondary to-card border-primary/20 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-border-secondary/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <ArrowRightLeft className="h-6 w-6 text-primary" />
              </div>
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Exchange RIOZ/BRL
              </span>
              <Badge variant="secondary" className="ml-auto text-xs">
                Taxa 1:1
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Saldos Compactos */}
            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-border/50">
              <div className="text-center p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 shadow-sm">
                <div className="text-xl font-bold text-primary mb-1">
                  R$ {brlBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground font-medium">Reais Brasileiros</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20 shadow-sm">
                <div className="text-xl font-bold text-foreground mb-1">
                  {riozBalance.toLocaleString('pt-BR')} RZ
                </div>
                <div className="text-xs text-muted-foreground font-medium">RIOZ Coin</div>
              </div>
            </div>
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
                      <div className="flex justify-between text-sm border-t pt-2">
                        <span>Você recebe:</span>
                        <span className="font-medium text-success">R$ {(parseFloat(amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
          </CardContent>
        </Card>

        {/* Hot Markets - Modern Grid Layout */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-5 w-5 text-orange-500" />
            <h2 className="text-2xl font-semibold">Mercados Hot</h2>
            <Badge variant="destructive" className="text-xs">
              Alta demanda
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topMarkets.slice(0, 6).map((market, index) => (
              <Card 
                key={market.id} 
                className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group bg-gradient-card border-primary/20"
                onClick={() => window.location.href = `/market/${market.id}`}
              >
                <CardContent className="p-4">
                  {/* Thumbnail Image with 16:7 aspect ratio */}
                  {market.thumbnail_url && (
                    <div className="w-full mb-3 rounded-lg overflow-hidden">
                      <img 
                        src={market.thumbnail_url} 
                        alt={market.titulo}
                        className="w-full h-full object-cover"
                        style={{ aspectRatio: '16/7' }}
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive" className="text-xs">
                          #{index + 1} HOT
                        </Badge>
                        <TrendingUp className="h-3 w-3 text-success" />
                      </div>
                      <h4 className="font-semibold text-xs leading-tight group-hover:text-primary transition-colors line-clamp-2">
                        {market.titulo}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {market.categoria}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        size="sm" 
                        className="bg-[#00ff90] hover:bg-[#00ff90]/90 text-black text-xs font-medium h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/market/${market.id}`;
                        }}
                      >
                        SIM {market.odds?.sim?.toFixed(1) || '1.8'}x
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-[#ff2389] hover:bg-[#ff2389]/90 text-white text-xs font-medium h-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `/market/${market.id}`;
                        }}
                      >
                        NÃO {market.odds?.nao?.toFixed(1) || '2.1'}x
                      </Button>
                    </div>
                    
                    <div className="pt-2 border-t border-border/30">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Volume 24h:</span>
                        <span className="font-medium">R$ {market.volume24h?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Exchange;