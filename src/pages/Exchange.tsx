import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowUpDown, Wallet, Loader2, ArrowDown, ArrowUp, CheckCircle2, Zap, Settings, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StarsBackground } from '@/components/ui/StarsBackground';

const ExchangeNew = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  
  const [brlBalance, setBrlBalance] = useState(0);
  const [riozBalance, setRiozBalance] = useState(0);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<'brl-to-rioz' | 'rioz-to-brl'>('brl-to-rioz');
  const [loading, setLoading] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [fastMarketsButtonVisible, setFastMarketsButtonVisible] = useState(false);
  const [activeAssets, setActiveAssets] = useState<{symbol: string, name: string, icon_url: string | null, is_active: boolean}[]>([]);
  const [allAssets, setAllAssets] = useState<{symbol: string, name: string, icon_url: string | null, is_active: boolean}[]>([]);
  const [exchangeEnabled, setExchangeEnabled] = useState(true);
  const [riozIconUrl, setRiozIconUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemConfig();
  }, []);

  const fetchSystemConfig = async () => {
    try {
      const { data } = await supabase
        .from('system_config')
        .select('exchange_enabled')
        .single();
      
      if (data) {
        setExchangeEnabled(data.exchange_enabled);
      }
    } catch (error) {
      console.error('Error fetching system config:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchBalances();
      fetchActiveAssets();
    }
  }, [user?.id]);

  const fetchActiveAssets = async () => {
    try {
      const { data, error } = await supabase
        .from('exchange_assets')
        .select('symbol, name, icon_url, is_active');

      if (error) throw error;
      
      const allData = data || [];
      setAllAssets(allData);
      setActiveAssets(allData.filter(a => a.is_active));
      
      // Find RIOZ icon
      const riozAsset = allData.find(a => a.symbol === 'RIOZ');
      if (riozAsset?.icon_url) {
        setRiozIconUrl(riozAsset.icon_url);
      }
    } catch (error) {
      console.error('Error fetching active assets:', error);
    }
  };
  
  // Show Fast Markets button for 30 seconds after successful conversion
  useEffect(() => {
    if (showSuccessNotification) {
      setFastMarketsButtonVisible(true);
      const timer = setTimeout(() => {
        setShowSuccessNotification(false);
        setFastMarketsButtonVisible(false);
      }, 30000); // 30 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showSuccessNotification]);

  const fetchBalances = async () => {
    if (!user?.id) return;
    
    try {
      const { data: balanceData } = await supabase
        .from('balances')
        .select('brl_balance')
        .eq('user_id', user.id)
        .single();

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

  const handleAmountChange = (value: string) => {
    const cleanValue = value.replace(/[^\d]/g, '');
    const numValue = parseFloat(cleanValue);
    if (numValue > 1000000000) return;
    
    setFromAmount(cleanValue);
    setToAmount(cleanValue);
  };

  const formatNumber = (value: string) => {
    if (!value) return '';
    return parseInt(value).toLocaleString('pt-BR');
  };

  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'brl-to-rioz' ? 'rioz-to-brl' : 'brl-to-rioz');
  };

  const handleMaxAmount = () => {
    const maxAmount = swapDirection === 'brl-to-rioz' ? brlBalance : riozBalance;
    setFromAmount(maxAmount.toString());
    setToAmount(maxAmount.toString());
  };

  const handleSwap = async () => {
    if (!user?.id || !fromAmount) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(fromAmount.replace(/[^\d.]/g, ''));
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive",
      });
      return;
    }

    const maxAmount = swapDirection === 'brl-to-rioz' ? brlBalance : riozBalance;
    
    if (amountNum > maxAmount) {
      toast({
        title: "Erro",
        description: `Saldo insuficiente. Máximo: ${maxAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('exchange-convert', {
        body: {
          operation: swapDirection === 'brl-to-rioz' ? 'buy_rioz' : 'sell_rioz',
          amount: amountNum
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Erro na conversão');
      }

      setBrlBalance(data.new_brl_balance);
      setRiozBalance(data.new_rioz_balance);
      
      setShowSuccessNotification(true);
      
      setFromAmount('');
      setToAmount('');
      
      await Promise.all([
        fetchBalances(),
        refetchProfile()
      ]);
      
      window.dispatchEvent(new CustomEvent('forceProfileRefresh'));
      
    } catch (error) {
      console.error('Erro na conversão:', error);
      toast({
        title: "Erro na operação",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fromCurrency = swapDirection === 'brl-to-rioz' ? 'BRL' : 'RIOZ';
  const toCurrency = swapDirection === 'brl-to-rioz' ? 'RIOZ' : 'BRL';
  const fromBalance = swapDirection === 'brl-to-rioz' ? brlBalance : riozBalance;
  const toBalance = swapDirection === 'brl-to-rioz' ? riozBalance : brlBalance;

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Wallet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Acesso necessário</h2>
            <p className="text-muted-foreground">Faça login para acessar o Exchange</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] relative pb-32">
      {/* Background gradient - hidden in light mode */}
      <div className="fixed inset-0 top-16 z-0 overflow-hidden dark:block hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, #0a0a0a 0%, #1a0a1a 50%, #0a0a0a 100%)'
          }}
        >
          <StarsBackground />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30">
              <ArrowUpDown className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground">Exchange</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Converta entre BRL e RIOZ com taxa fixa 1:1
          </p>
        </div>

        {/* Swap Interface */}
        <Card className="bg-gradient-to-br from-card/95 to-card-secondary/95 border border-primary/30 shadow-xl relative">
          {!exchangeEnabled && (
            <div className="absolute inset-0 bg-background/90 backdrop-blur-md z-50 rounded-lg flex items-center justify-center">
              <div className="text-center p-8">
                <Settings className="w-16 h-16 mx-auto mb-4 text-primary animate-[spin_3s_linear_infinite]" />
                <h2 className="text-2xl font-bold mb-2">Exchange em Atualização</h2>
                <p className="text-muted-foreground">
                  Estamos melhorando o sistema de conversão.
                  <br />
                  Volte em breve!
                </p>
              </div>
            </div>
          )}
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Conversão Instantânea
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* From Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-foreground">De</Label>
                <div className="text-sm font-medium text-foreground bg-muted/50 px-3 py-1 rounded-md">
                  Saldo: {fromBalance.toLocaleString('pt-BR', { 
                    minimumFractionDigits: fromCurrency === 'BRL' ? 2 : 0,
                    maximumFractionDigits: fromCurrency === 'BRL' ? 2 : 0
                  })} {fromCurrency}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative bg-muted/30 rounded-2xl border-2 border-border hover:border-primary/50 transition-colors">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      {fromCurrency === 'BRL' ? (
                        <div className="w-full h-full bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-base font-bold text-white">R$</span>
                        </div>
                      ) : riozIconUrl ? (
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                          <img src={riozIconUrl} alt="RIOZ" className="w-full h-full object-cover scale-100" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-black">R</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-card border-border shadow-xl rounded-xl p-2 min-w-[280px] z-[100]">
                        <div className="p-3 border-b border-border mb-2">
                          <p className="text-sm font-semibold text-foreground mb-1">Outros Ativos</p>
                          <p className="text-xs text-muted-foreground">Selecione um ativo para converter</p>
                        </div>
                       {allAssets
                         .filter(a => a.symbol !== fromCurrency && a.symbol !== toCurrency)
                          .map(asset => (
                            <DropdownMenuItem 
                              key={asset.symbol}
                              className={`p-3 rounded-lg transition-colors ${
                                asset.is_active ? 'cursor-pointer hover:bg-[#0A101A]' : 'opacity-60 cursor-not-allowed'
                              }`}
                              disabled={!asset.is_active}
                              onClick={() => {
                                if (asset.is_active) {
                                  // Don't toggle direction, just update the state if needed
                                  // The asset is already handled by the swap logic
                                }
                              }}
                            >
                              <div className="flex items-center gap-3 w-full">
                                {asset.icon_url && (
                                  <img src={asset.icon_url} alt={asset.name} className="w-6 h-6 rounded-full object-cover" />
                                )}
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{asset.name} ({asset.symbol})</p>
                                  <p className="text-xs text-muted-foreground">
                                    {asset.is_active ? 'Disponível' : 'Indisponível'}
                                  </p>
                                </div>
                              </div>
                           </DropdownMenuItem>
                         ))}
                        {allAssets.filter(a => a.symbol !== fromCurrency && a.symbol !== toCurrency).length === 0 && (
                          <div className="p-3 text-center text-sm text-muted-foreground">
                            Nenhum outro ativo disponível
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex flex-col pointer-events-none">
                      <span className="text-2xl font-bold text-foreground">
                        {fromCurrency}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMaxAmount}
                        className="text-lg font-bold text-primary hover:text-primary/80 h-auto p-0 justify-start pointer-events-auto"
                      >
                        MAX
                      </Button>
                    </div>
                  </div>
                  <Input
                    type="text"
                    placeholder="0"
                    value={formatNumber(fromAmount)}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="pl-32 pr-4 h-32 text-right text-3xl md:text-6xl leading-none font-bold bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus-visible:caret-[#00ff90] selection:bg-[#00ff90]/30"
                  />
                </div>
                {fromAmount && parseFloat(fromAmount.replace(/[^\d.]/g, '')) > fromBalance && (
                  <div className="flex items-center justify-center gap-2 text-sm font-medium px-4 py-2 rounded-lg border-2" style={{ color: '#ff2389', backgroundColor: 'rgba(255, 35, 137, 0.1)', borderColor: 'rgba(255, 35, 137, 0.3)' }}>
                    <span>Saldo insuficiente</span>
                  </div>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwapDirection}
                className="rounded-full h-12 w-12 border-2 hover:border-primary/50 hover:scale-110 hover:rotate-180 transition-all duration-300"
              >
                <ArrowUpDown className="h-5 w-5" />
              </Button>
            </div>

            {/* To Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-foreground">Para</Label>
                <div className="text-sm font-medium text-foreground bg-muted/50 px-3 py-1 rounded-md">
                  Saldo: {toBalance.toLocaleString('pt-BR', { 
                    minimumFractionDigits: toCurrency === 'BRL' ? 2 : 0,
                    maximumFractionDigits: toCurrency === 'BRL' ? 2 : 0
                  })} {toCurrency}
                </div>
              </div>
              
              <div className="relative bg-muted/30 rounded-2xl border-2 border-border hover:border-primary/50 transition-colors">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center">
                      {toCurrency === 'BRL' ? (
                        <div className="w-full h-full bg-green-600 rounded-full flex items-center justify-center">
                          <span className="text-base font-bold text-white">R$</span>
                        </div>
                      ) : riozIconUrl ? (
                        <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden">
                          <img src={riozIconUrl} alt="RIOZ" className="w-full h-full object-cover scale-100" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-black">R</span>
                        </div>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-card border-border shadow-xl rounded-xl p-2 min-w-[280px] z-[100]">
                      <div className="p-3 border-b border-border mb-2">
                        <p className="text-sm font-semibold text-foreground mb-1">Outros Ativos</p>
                        <p className="text-xs text-muted-foreground">Selecione um ativo para converter</p>
                      </div>
                       {allAssets
                         .filter(a => a.symbol !== fromCurrency && a.symbol !== toCurrency)
                          .map(asset => (
                            <DropdownMenuItem 
                              key={asset.symbol}
                              className={`p-3 rounded-lg transition-colors ${
                                asset.is_active ? 'cursor-pointer hover:bg-[#0A101A]' : 'opacity-60 cursor-not-allowed'
                              }`}
                              disabled={!asset.is_active}
                              onClick={() => {
                                if (asset.is_active) {
                                  // Swap the selected asset with the "To" currency
                                  if (swapDirection === 'brl-to-rioz') {
                                    setSwapDirection('rioz-to-brl');
                                  } else {
                                    setSwapDirection('brl-to-rioz');
                                  }
                                }
                              }}
                            >
                             <div className="flex items-center gap-3 w-full">
                               {asset.icon_url && (
                                 <img src={asset.icon_url} alt={asset.name} className="w-6 h-6 rounded-full" />
                               )}
                               <div className="flex-1">
                                 <p className="font-medium text-foreground">{asset.name} ({asset.symbol})</p>
                                 <p className="text-xs text-muted-foreground">
                                   {asset.is_active ? 'Disponível' : 'Indisponível'}
                                 </p>
                               </div>
                             </div>
                           </DropdownMenuItem>
                         ))}
                      {allAssets.filter(a => a.symbol !== fromCurrency && a.symbol !== toCurrency).length === 0 && (
                        <div className="p-3 text-center text-sm text-muted-foreground">
                          Nenhum outro ativo disponível
                        </div>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex flex-col pointer-events-none">
                    <span className="text-2xl font-bold text-foreground">
                      {toCurrency}
                    </span>
                  </div>
                </div>
                <Input
                  type="text"
                  placeholder="0"
                  value={formatNumber(toAmount)}
                  readOnly
                  className="pl-32 pr-4 h-32 text-right text-3xl md:text-6xl leading-none font-bold bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none cursor-default"
                />
              </div>
            </div>

            {/* Convert Button */}
            <Button
              onClick={handleSwap}
              disabled={loading || !fromAmount || parseFloat(fromAmount.replace(/[^\d.]/g, '')) > fromBalance || !exchangeEnabled || profile?.is_blocked}
              className="w-full h-16 text-lg font-bold shadow-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <ArrowUpDown className="w-5 h-5 mr-2" />
                  Converter Agora
                </>
              )}
            </Button>

            {/* Rate Info */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>Taxa fixa 1:1</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4 text-primary" />
                <span>Conversão instantânea</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fast Markets Button and Success Notification - shown after conversion */}
        {fastMarketsButtonVisible && (
          <div className="mt-6 space-y-4">
            <Button
              onClick={() => window.location.href = '/fast'}
              className="w-full h-14 text-lg font-bold text-black shadow-lg transition-all hover:scale-105 active:scale-95 animate-pulse"
              style={{ 
                backgroundColor: '#ff2389',
                boxShadow: '0 0 30px rgba(255, 35, 137, 0.6), 0 0 60px rgba(255, 35, 137, 0.3)'
              }}
            >
              <Zap className="w-5 h-5 mr-2 fill-black" />
              Ir para Fast Markets
            </Button>
            
            <Card className="border-success bg-success/10">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-success">Conversão realizada!</p>
                  <p className="text-sm text-muted-foreground">Seus saldos foram atualizados</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <ArrowDown className="h-4 w-4 text-success" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Taxa Fixa</h3>
                  <p className="text-xs text-muted-foreground">Conversão 1:1 garantida</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-sm">Instantâneo</h3>
                  <p className="text-xs text-muted-foreground">Conversão em tempo real</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExchangeNew;
