import { useState, useEffect, useMemo } from 'react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { ExchangeService } from '@/services/exchange';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowUpDown, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { track } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import { ConfirmExchangeModal } from './ConfirmExchangeModal';

export const ExchangeWidget = () => {
  const { toast } = useToast();
  const { 
    rate, 
    balance, 
    exchangeLoading, 
    exchangeError, 
    performExchange 
  } = useExchangeStore();

  const [activeTab, setActiveTab] = useState<'buy_rioz' | 'sell_rioz'>('buy_rioz');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [inputCurrency, setInputCurrency] = useState<'BRL' | 'RIOZ'>('BRL');
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Calculate preview when inputs change
  const preview = useMemo(() => {
    if (!rate || !inputAmount || isNaN(parseFloat(inputAmount))) {
      return null;
    }

    const amount = parseFloat(inputAmount);
    if (amount <= 0) return null;

    return ExchangeService.calculatePreview(
      activeTab,
      amount,
      inputCurrency,
      rate.price
    );
  }, [activeTab, inputAmount, inputCurrency, rate]);

  // Enhanced validation with proper limits
  const validation = useMemo(() => {
    const numAmount = parseFloat(inputAmount);
    
    if (!inputAmount || isNaN(numAmount) || numAmount <= 0) {
      return { valid: false, error: 'Insira um valor válido' };
    }

    if (activeTab === 'buy_rioz' && inputCurrency === 'BRL') {
      if (numAmount < 1) {
        return { valid: false, error: 'Valor mínimo: R$ 1,00' };
      }
      if (numAmount > 10000) {
        return { valid: false, error: 'Valor máximo: R$ 10.000,00 por transação' };
      }
      if (numAmount > (balance?.brl_balance || 0)) {
        return { valid: false, error: 'Saldo BRL insuficiente' };
      }
    }

    if (activeTab === 'sell_rioz' && inputCurrency === 'RIOZ') {
      if (numAmount < 0.01) {
        return { valid: false, error: 'Valor mínimo: 0,01 RIOZ' };
      }
      if (numAmount > 100000) {
        return { valid: false, error: 'Valor máximo: 100.000 RIOZ por transação' };
      }
      if (numAmount > (balance?.rioz_balance || 0)) {
        return { valid: false, error: 'Saldo RIOZ insuficiente' };
      }
    }

    return { valid: true, error: null };
  }, [inputAmount, activeTab, inputCurrency, balance]);

  // Tab change with tracking and auto-currency switch
  const handleTabChange = (value: string) => {
    const newTab = value as 'buy_rioz' | 'sell_rioz';
    setActiveTab(newTab);
    setInputAmount('');
    
    // Auto switch currency based on tab
    if (newTab === 'buy_rioz') {
      setInputCurrency('BRL');
    } else {
      setInputCurrency('RIOZ');
    }

    track('switch_exchange_tab', { tab: newTab });
  };

  // Input change with validation
  const handleInputChange = (value: string) => {
    setInputAmount(value);
    if (value && parseFloat(value) > 0) {
      track('input_exchange_value', { 
        value: parseFloat(value), 
        currency: inputCurrency 
      });
    }
  };

  // Currency swap with conversion
  const handleSwapCurrency = () => {
    if (!rate || !inputAmount) {
      setInputCurrency(inputCurrency === 'BRL' ? 'RIOZ' : 'BRL');
      return;
    }

    const amount = parseFloat(inputAmount);
    if (!isNaN(amount) && amount > 0) {
      if (inputCurrency === 'BRL') {
        // Convert BRL to RIOZ
        setInputCurrency('RIOZ');
        setInputAmount((amount / rate.price).toFixed(6));
      } else {
        // Convert RIOZ to BRL
        setInputCurrency('BRL');
        setInputAmount((amount * rate.price).toFixed(2));
      }
    }
    setInputCurrency(inputCurrency === 'BRL' ? 'RIOZ' : 'BRL');
  };

  const handleSubmit = async () => {
    if (!validation.valid || !inputAmount) return;
    
    const numAmount = parseFloat(inputAmount);
    
    // Para transações grandes (≥ R$ 100), mostrar modal de confirmação
    if (preview && preview.netAmount >= 100) {
      setShowConfirmModal(true);
      return;
    }

    await executeExchange();
  };

  const executeExchange = async () => {
    if (!validation.valid || !inputAmount) return;

    try {
      const numAmount = parseFloat(inputAmount);
      
      track('submit_exchange_request', {
        side: activeTab,
        amount_input: numAmount,
        input_currency: inputCurrency,
        applied_price: rate?.price
      });

      const result = await performExchange(
        activeTab,
        numAmount,
        inputCurrency
      );

      track('exchange_filled', {
        order_id: result.orderId,
        side: activeTab,
        amount_rioz: result.amountRioz,
        amount_brl: result.amountBrl,
        fee_rioz: result.feeRioz,
        fee_brl: result.feeBrl
      });

      toast({
        title: "Conversão realizada!",
        description: `${activeTab === 'buy_rioz' ? 'Compra' : 'Venda'} executada com sucesso.`,
      });

      setInputAmount('');
      setShowConfirmModal(false);
    } catch (error) {
      track('exchange_failed', {
        side: activeTab,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: "Erro na conversão",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive",
      });
    }
  };

  // Track preview display
  useEffect(() => {
    if (preview) {
      track('view_exchange_quote', {
        side: activeTab,
        input_amount: parseFloat(inputAmount),
        output_amount: preview.outputAmount,
        fee: preview.fee
      });
    }
  }, [preview, activeTab, inputAmount]);

  // Loading state
  if (!rate) {
    return (
      <Card data-exchange-widget>
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00FF91]" />
            Carregando Exchange...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">
            Buscando taxa de câmbio atual...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card data-exchange-widget>
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#00FF91]" />
            Exchange Rioz Coin
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy_rioz" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Comprar
              </TabsTrigger>
              <TabsTrigger value="sell_rioz" className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Vender
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy_rioz" className="space-y-6 mt-6">
              {/* Buy Form */}
              <div className="space-y-4">
                {/* Input Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Você paga</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSwapCurrency}
                      className="h-6 px-2 text-xs"
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      Trocar
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={inputAmount}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="pr-16 text-lg"
                      step={inputCurrency === 'BRL' ? '0.01' : '0.000001'}
                      min="0"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      {inputCurrency}
                    </div>
                  </div>
                  {balance && (
                    <p className="text-xs text-muted-foreground">
                      Disponível: {inputCurrency === 'BRL' 
                        ? ExchangeService.formatCurrency(balance.brl_balance, 'BRL')
                        : ExchangeService.formatCurrency(balance.rioz_balance, 'RIOZ')
                      }
                    </p>
                  )}
                </div>

                <Separator />

                {/* Output Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Você recebe</label>
                  <div className="relative">
                     <div className="border rounded-lg px-3 py-3 bg-muted/50">
                      <div className="text-lg font-medium">
                        {preview ? (
                          ExchangeService.formatCurrency(preview.outputAmount, 'RIOZ')
                        ) : (
                          '0 RIOZ'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Details */}
              {preview && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa:</span>
                    <span>1 RIOZ = {ExchangeService.formatPrice(rate.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de serviço (2%):</span>
                    <span>{ExchangeService.formatCurrency(preview.fee, 'BRL')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{ExchangeService.formatCurrency(preview.netAmount, 'BRL')}</span>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sell_rioz" className="space-y-6 mt-6">
              {/* Sell Form */}
              <div className="space-y-4">
                {/* Input Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Você vende</label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSwapCurrency}
                      className="h-6 px-2 text-xs"
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      Trocar
                    </Button>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={inputAmount}
                      onChange={(e) => handleInputChange(e.target.value)}
                      className="pr-16 text-lg"
                      step={inputCurrency === 'BRL' ? '0.01' : '0.000001'}
                      min="0"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      {inputCurrency}
                    </div>
                  </div>
                  {balance && (
                    <p className="text-xs text-muted-foreground">
                      Disponível: {inputCurrency === 'RIOZ'
                        ? ExchangeService.formatCurrency(balance.rioz_balance, 'RIOZ')
                        : ExchangeService.formatCurrency(balance.brl_balance, 'BRL')
                      }
                    </p>
                  )}
                </div>

                <Separator />

                {/* Output Amount */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Você recebe</label>
                  <div className="relative">
                    <div className="border rounded-lg px-3 py-3 bg-muted/50">
                      <div className="text-lg font-medium">
                        {preview ? (
                          ExchangeService.formatCurrency(preview.outputAmount, 'BRL')
                        ) : (
                          'R$ 0,00'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Details */}
              {preview && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa:</span>
                    <span>1 RIOZ = {ExchangeService.formatPrice(rate.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa de serviço (2%):</span>
                    <span>{ExchangeService.formatCurrency(preview.fee, 'BRL')}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>{ExchangeService.formatCurrency(preview.netAmount, 'BRL')}</span>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Error Messages */}
          {!validation.valid && validation.error && (
             <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {validation.error}
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
            disabled={!validation.valid || exchangeLoading}
            className="w-full h-12 text-base font-medium"
            size="lg"
          >
            {exchangeLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (balance?.brl_balance || 0) === 0 && activeTab === 'buy_rioz' ? (
              'Depositar'
            ) : activeTab === 'buy_rioz' ? (
              'Comprar Rioz'
            ) : (
              'Vender Rioz'
            )}
          </Button>
        </CardContent>
      </Card>
      
      {/* Confirmation Modal */}
      <ConfirmExchangeModal
        open={showConfirmModal}
        onOpenChange={setShowConfirmModal}
        side={activeTab}
        inputAmount={inputAmount}
        inputCurrency={inputCurrency}
        rate={rate}
        onConfirm={executeExchange}
        isLoading={exchangeLoading}
      />
    </>
  );
};