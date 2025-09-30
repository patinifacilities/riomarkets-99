import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, Wallet, Loader2, ArrowDown, ArrowUp, Bitcoin, Coins, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

  useEffect(() => {
    if (user?.id) {
      fetchBalances();
    }
  }, [user?.id]);

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
    setFromAmount(value);
    // 1:1 conversion rate
    setToAmount(value);
  };

  const handleSwapDirection = () => {
    setSwapDirection(prev => prev === 'brl-to-rioz' ? 'rioz-to-brl' : 'brl-to-rioz');
    setFromAmount('');
    setToAmount('');
  };

  const handleMaxAmount = () => {
    const maxAmount = swapDirection === 'brl-to-rioz' ? brlBalance : riozBalance;
    setFromAmount(maxAmount.toString());
    setToAmount(maxAmount.toString());
  };

  const handleSwap = async () => {
    if (!user?.id || !fromAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Digite um valor válido",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(fromAmount);
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
      setTimeout(() => setShowSuccessNotification(false), 5000);
      
      toast({
        title: "Conversão realizada!",
        description: swapDirection === 'brl-to-rioz' 
          ? `Você converteu R$ ${amountNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para ${amountNum.toLocaleString('pt-BR')} RIOZ`
          : `Você converteu ${amountNum.toLocaleString('pt-BR')} RIOZ para R$ ${amountNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      });
      
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
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
        <Card className="bg-gradient-to-br from-card/95 to-card-secondary/95 border border-primary/30 shadow-xl">
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
              
              <div className="relative bg-muted/30 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${
                        fromCurrency === 'BRL' ? 'bg-gray-200' : 'bg-[#00ff90]'
                      }`}>
                        {fromCurrency === 'BRL' ? (
                          <span className="text-sm font-bold text-gray-700">R$</span>
                        ) : (
                          <span className="text-lg font-bold text-black">R</span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem disabled className="opacity-50">
                        <Bitcoin className="w-4 h-4 mr-2" />
                        BTC - Em breve
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="opacity-50">
                        <Coins className="w-4 h-4 mr-2" />
                        USDT - Em breve
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="opacity-50">
                        <Coins className="w-4 h-4 mr-2" />
                        USDC - Em breve
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <div className="flex flex-col pointer-events-none">
                    <span className="text-sm font-medium text-foreground">
                      {fromCurrency}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMaxAmount}
                      className="text-xs text-primary hover:text-primary/80 h-auto p-0 justify-start pointer-events-auto"
                    >
                      Max
                    </Button>
                  </div>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={fromAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-32 pr-4 h-24 text-right text-5xl font-bold bg-transparent border-0 focus-visible:ring-0 focus-visible:caret-[#00ff90] selection:bg-[#00ff90]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  step={fromCurrency === 'BRL' ? '0.01' : '1'}
                />
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
              
              <div className="relative bg-muted/30 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3 z-10">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity ${
                        toCurrency === 'BRL' ? 'bg-gray-200' : 'bg-[#00ff90]'
                      }`}>
                        {toCurrency === 'BRL' ? (
                          <span className="text-sm font-bold text-gray-700">R$</span>
                        ) : (
                          <span className="text-lg font-bold text-black">R</span>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem disabled className="opacity-50">
                        <Bitcoin className="w-4 h-4 mr-2" />
                        BTC - Em breve
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="opacity-50">
                        <Coins className="w-4 h-4 mr-2" />
                        USDT - Em breve
                      </DropdownMenuItem>
                      <DropdownMenuItem disabled className="opacity-50">
                        <Coins className="w-4 h-4 mr-2" />
                        USDC - Em breve
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="text-sm font-medium text-foreground ml-2">
                    {toCurrency}
                  </span>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={toAmount}
                  readOnly
                  className="pl-32 pr-4 h-24 text-right text-5xl font-bold bg-transparent border-0 focus-visible:ring-0 focus-visible:caret-[#00ff90] selection:bg-[#00ff90]/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <Separator />

            {/* Exchange Rate */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de conversão</span>
                <span className="font-medium">1:1</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Taxa de serviço</span>
                <span className="font-medium text-success">Gratuito</span>
              </div>
            </div>

            {/* Convert Button */}
            <Button
              onClick={handleSwap}
              disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
              className="w-full h-14 text-lg font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Convertendo...
                </>
              ) : (
                'Converter'
              )}
            </Button>
            
            {showSuccessNotification && (
              <div className="bg-gradient-to-r from-[#00ff90]/20 to-[#00ff90]/10 border-2 border-[#00ff90] px-6 py-4 rounded-xl text-sm font-medium animate-scale-in flex items-center gap-3 shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-[#00ff90]" />
                <div>
                  <div className="text-[#00ff90] font-bold text-base">Conversão realizada!</div>
                  <div className="text-muted-foreground text-xs mt-0.5">Seus saldos foram atualizados</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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