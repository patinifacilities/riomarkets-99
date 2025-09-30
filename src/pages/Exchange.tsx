import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, Wallet, Loader2, ArrowDown, ArrowUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
                <Label className="text-sm font-medium">Você paga</Label>
                <div className="text-sm text-muted-foreground">
                  Saldo: {fromBalance.toLocaleString('pt-BR', { 
                    minimumFractionDigits: fromCurrency === 'BRL' ? 2 : 0,
                    maximumFractionDigits: fromCurrency === 'BRL' ? 2 : 0
                  })} {fromCurrency}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {fromCurrency === 'BRL' ? (
                      <span className="text-sm font-bold">R$</span>
                    ) : (
                      <span className="text-sm font-bold">R</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {fromCurrency}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMaxAmount}
                    className="text-xs px-2 py-1 h-6"
                  >
                    MAX
                  </Button>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={fromAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="pl-36 pr-4 h-16 text-right text-lg font-medium"
                  step={fromCurrency === 'BRL' ? '0.01' : '1'}
                />
              </div>
            </div>

            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapDirection}
                className="rounded-full p-3 border-2 hover:border-primary/50"
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>

            {/* To Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Você recebe</Label>
                <div className="text-sm text-muted-foreground">
                  Saldo: {toBalance.toLocaleString('pt-BR', { 
                    minimumFractionDigits: toCurrency === 'BRL' ? 2 : 0,
                    maximumFractionDigits: toCurrency === 'BRL' ? 2 : 0
                  })} {toCurrency}
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {toCurrency === 'BRL' ? (
                      <span className="text-sm font-bold">R$</span>
                    ) : (
                      <span className="text-sm font-bold">R</span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">
                    {toCurrency}
                  </span>
                </div>
                <Input
                  type="number"
                  placeholder="0"
                  value={toAmount}
                  readOnly
                  className="pl-32 pr-4 h-16 text-right text-lg font-medium bg-muted/50"
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

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={loading || !fromAmount || parseFloat(fromAmount) <= 0}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Convertendo...
                </>
              ) : (
                <>
                  <ArrowUpDown className="h-5 w-5 mr-2" />
                  Converter
                </>
              )}
            </Button>
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