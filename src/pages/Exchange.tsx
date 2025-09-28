import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowRightLeft, Wallet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Exchange = () => {
  const { user } = useAuth();
  const { data: profile, refetch: refetchProfile } = useProfile(user?.id);
  const { toast } = useToast();
  
  const [brlBalance, setBrlBalance] = useState(0);
  const [riozBalance, setRiozBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

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
    
    // Validar saldos
    if (activeTab === 'buy' && brlBalance < amountNum) {
      toast({
        title: "Erro",
        description: "Saldo BRL insuficiente",
        variant: "destructive",
      });
      return;
    }
    
    if (activeTab === 'sell' && riozBalance < amountNum) {
      toast({
        title: "Erro", 
        description: "Saldo RIOZ insuficiente",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      if (activeTab === 'buy') {
        // Comprar RIOZ com BRL (ratio 1:1)
        const newBrlBalance = brlBalance - amountNum;
        const newRiozBalance = riozBalance + amountNum;
        
        // Atualizar saldo BRL
        await supabase
          .from('balances')
          .update({ brl_balance: newBrlBalance })
          .eq('user_id', user.id);
          
        // Atualizar saldo RIOZ
        await supabase
          .from('profiles')
          .update({ saldo_moeda: newRiozBalance })
          .eq('id', user.id);
          
        // Atualizar estado local
        setBrlBalance(newBrlBalance);
        setRiozBalance(newRiozBalance);
        
        toast({
          title: "Compra realizada!",
          description: `Você comprou ${amountNum} RIOZ por R$ ${amountNum}`,
        });
      } else {
        // Vender RIOZ por BRL (ratio 1:1)
        const newBrlBalance = brlBalance + amountNum;
        const newRiozBalance = riozBalance - amountNum;
        
        // Atualizar saldo BRL
        await supabase
          .from('balances')
          .update({ brl_balance: newBrlBalance })
          .eq('user_id', user.id);
          
        // Atualizar saldo RIOZ  
        await supabase
          .from('profiles')
          .update({ saldo_moeda: newRiozBalance })
          .eq('id', user.id);
          
        // Atualizar estado local
        setBrlBalance(newBrlBalance);
        setRiozBalance(newRiozBalance);
        
        toast({
          title: "Venda realizada!",
          description: `Você vendeu ${amountNum} RIOZ por R$ ${amountNum}`,
        });
      }
      
      // Log da transação
      await supabase.from('exchange_orders').insert({
        user_id: user.id,
        side: activeTab === 'buy' ? 'buy_rioz' : 'sell_rioz',
        price_brl_per_rioz: 1.0,
        amount_rioz: amountNum,
        amount_brl: amountNum,
        status: 'filled',
        filled_at: new Date().toISOString()
      });
      
      // Limpar formulário
      setAmount('');
      
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
    return activeTab === 'buy' ? brlBalance : riozBalance;
  };

  return (
    <div className="min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Exchange RIOZ/BRL</h1>
          <p className="text-muted-foreground">
            Troque entre RIOZ e Reais brasileiros na taxa 1:1
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

        {/* Interface de Troca */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5" />
              Conversão Imediata - Taxa 1:1
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
                <div className="space-y-2">
                  <Label htmlFor="buy-amount">
                    Quantidade RIOZ (máximo: {brlBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})
                  </Label>
                  <Input
                    id="buy-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    max={brlBalance}
                    step="1"
                    min="0"
                  />
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Você paga:</span>
                    <span className="font-medium">R$ {(parseFloat(amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Você recebe:</span>
                    <span className="font-medium">{(parseFloat(amount) || 0).toLocaleString('pt-BR')} RZ</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleExchange}
                  disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > brlBalance}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                  )}
                  Comprar RIOZ
                </Button>
              </TabsContent>
              
              <TabsContent value="sell" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sell-amount">
                    Quantidade RIOZ (máximo: {riozBalance.toLocaleString('pt-BR')})
                  </Label>
                  <Input
                    id="sell-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    max={riozBalance}
                    step="1"
                    min="0"
                  />
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Você vende:</span>
                    <span className="font-medium">{(parseFloat(amount) || 0).toLocaleString('pt-BR')} RZ</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Você recebe:</span>
                    <span className="font-medium">R$ {(parseFloat(amount) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleExchange}
                  disabled={loading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > riozBalance}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Exchange;