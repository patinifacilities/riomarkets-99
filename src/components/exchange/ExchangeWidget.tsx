import { useState } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ExchangeWidget = () => {
  const { toast } = useToast();
  const { 
    balance, 
    exchangeLoading, 
    exchangeError, 
    performExchange 
  } = useExchangeStore();

  const [activeTab, setActiveTab] = useState<'buy_rioz' | 'sell_rioz'>('buy_rioz');
  const [amount, setAmount] = useState<string>('');

  // Simple validation
  const isValid = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) return false;
    
    if (activeTab === 'buy_rioz') {
      return numAmount <= (balance?.brl_balance || 0);
    } else {
      return numAmount <= (balance?.rioz_balance || 0);
    }
  };

  const getErrorMessage = () => {
    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return 'Insira um valor válido';
    }
    
    if (activeTab === 'buy_rioz') {
      if (numAmount > (balance?.brl_balance || 0)) {
        return 'Saldo BRL insuficiente';
      }
    } else {
      if (numAmount > (balance?.rioz_balance || 0)) {
        return 'Saldo RIOZ insuficiente';
      }
    }
    return null;
  };

  // Calculate output amount (1:1 conversion)
  const outputAmount = amount ? parseFloat(amount) : 0;

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'buy_rioz' | 'sell_rioz');
    setAmount('');
  };

  const handleSubmit = async () => {
    if (!isValid()) return;

    try {
      const numAmount = parseFloat(amount);
      
      await performExchange(
        activeTab,
        numAmount,
        activeTab === 'buy_rioz' ? 'BRL' : 'RIOZ'
      );

      toast({
        title: "Conversão realizada!",
        description: `${activeTab === 'buy_rioz' ? 'Compra' : 'Venda'} executada com sucesso.`,
      });

      setAmount('');
    } catch (error) {
      toast({
        title: "Erro na conversão",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };


  return (
    <Card data-exchange-widget>
      <CardHeader>
        <CardTitle className="flex items-center justify-center gap-2">
          <TrendingUp className="h-5 w-5 text-[#00FF91]" />
          Exchange Rioz Coin (1:1)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy_rioz" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Comprar RIOZ
            </TabsTrigger>
            <TabsTrigger value="sell_rioz" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Vender RIOZ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buy_rioz" className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor em BRL</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                step="0.01"
                min="0"
              />
              {balance && (
                <p className="text-xs text-muted-foreground">
                  Disponível: R$ {balance.brl_balance.toFixed(2)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Você recebe</label>
              <div className="border rounded-lg px-3 py-3 bg-muted/50">
                <div className="text-lg font-medium">
                  {outputAmount.toFixed(2)} RIOZ
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="text-center">
                <span className="font-medium">Taxa: 1 BRL = 1 RIOZ</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="sell_rioz" className="space-y-4 mt-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor em RIOZ</label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="text-lg"
                step="0.01"
                min="0"
              />
              {balance && (
                <p className="text-xs text-muted-foreground">
                  Disponível: {balance.rioz_balance.toFixed(2)} RIOZ
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Você recebe</label>
              <div className="border rounded-lg px-3 py-3 bg-muted/50">
                <div className="text-lg font-medium">
                  R$ {outputAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="text-center">
                <span className="font-medium">Taxa: 1 RIOZ = 1 BRL</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Error Messages */}
        {!isValid() && getErrorMessage() && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {getErrorMessage()}
          </div>
        )}

        {/* Exchange Error */}
        {exchangeError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            {exchangeError}
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isValid() || exchangeLoading}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {exchangeLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : activeTab === 'buy_rioz' ? (
            'Comprar RIOZ'
          ) : (
            'Vender RIOZ'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};