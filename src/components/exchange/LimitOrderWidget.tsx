import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useExchangeStore } from '@/stores/useExchangeStore';
import { LimitOrderService, CreateLimitOrderParams, LimitOrderPreview } from '@/services/limitOrders';
import { useLimitOrderStore } from '@/stores/useLimitOrderStore';
import { useToast } from '@/hooks/use-toast';

interface LimitOrderWidgetProps {
  side: 'buy_rioz' | 'sell_rioz';
}

export const LimitOrderWidget: React.FC<LimitOrderWidgetProps> = ({ side }) => {
  const { rate, balance } = useExchangeStore();
  const { fetchActiveOrders } = useLimitOrderStore();
  const { toast } = useToast();
  
  const [amountInput, setAmountInput] = useState('');
  const [inputCurrency, setInputCurrency] = useState<'BRL' | 'RIOZ'>(side === 'buy_rioz' ? 'BRL' : 'RIOZ');
  const [limitPrice, setLimitPrice] = useState('');
  const [expiresIn, setExpiresIn] = useState<'1h' | '24h' | '7d'>('24h');
  const [preview, setPreview] = useState<LimitOrderPreview | null>(null);
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });
  const [isCreating, setIsCreating] = useState(false);

  const currentPrice = rate?.price || 0;

  // Update preview when inputs change
  useEffect(() => {
    if (amountInput && limitPrice && currentPrice > 0) {
      const amount = parseFloat(amountInput);
      const price = parseFloat(limitPrice);
      
      if (!isNaN(amount) && !isNaN(price) && amount > 0 && price > 0) {
        const newPreview = LimitOrderService.calculateLimitOrderPreview(
          side,
          amount,
          inputCurrency,
          price,
          currentPrice
        );
        setPreview(newPreview);
        
        // Validate the order
        const amountBrl = inputCurrency === 'BRL' ? amount : amount * price;
        const newValidation = LimitOrderService.validateLimitOrder(side, price, currentPrice, amountBrl);
        setValidation(newValidation);
      } else {
        setPreview(null);
        setValidation({ isValid: true });
      }
    } else {
      setPreview(null);
      setValidation({ isValid: true });
    }
  }, [amountInput, limitPrice, inputCurrency, side, currentPrice]);

  // Set default limit price when side changes
  useEffect(() => {
    if (currentPrice > 0) {
      const defaultPrice = side === 'buy_rioz' 
        ? (currentPrice * 0.95).toFixed(4) // 5% below for buy
        : (currentPrice * 1.05).toFixed(4); // 5% above for sell
      setLimitPrice(defaultPrice);
    }
  }, [side, currentPrice]);

  const handleSwapCurrency = () => {
    if (preview) {
      const newCurrency = inputCurrency === 'BRL' ? 'RIOZ' : 'BRL';
      const newAmount = newCurrency === 'BRL' ? preview.amountBrl.toString() : preview.amountRioz.toString();
      
      setInputCurrency(newCurrency);
      setAmountInput(newAmount);
    }
  };

  const handleCreateOrder = async () => {
    if (!preview || !validation.isValid || isCreating) return;

    setIsCreating(true);
    
    try {
      const params: CreateLimitOrderParams = {
        side,
        amountInput: parseFloat(amountInput),
        inputCurrency,
        limitPrice: parseFloat(limitPrice),
        expiresIn
      };

      await LimitOrderService.createLimitOrder(params);
      
      toast({
        title: 'Ordem Limit Criada',
        description: `Sua ordem ${side === 'buy_rioz' ? 'de compra' : 'de venda'} foi criada com sucesso!`,
      });

      // Reset form
      setAmountInput('');
      setLimitPrice(side === 'buy_rioz' ? (currentPrice * 0.95).toFixed(4) : (currentPrice * 1.05).toFixed(4));
      
      // Refresh active orders
      await fetchActiveOrders();
      
    } catch (error) {
      console.error('Error creating limit order:', error);
      toast({
        title: 'Erro ao Criar Ordem',
        description: error instanceof Error ? error.message : 'Falha ao criar ordem limit',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Check if user has sufficient balance
  const hasInsufficientBalance = () => {
    if (!preview || !balance) return false;
    
    if (side === 'buy_rioz') {
      return balance.brl_balance < preview.amountBrl;
    } else {
      return balance.rioz_balance < preview.amountRioz;
    }
  };

  const insufficientBalance = hasInsufficientBalance();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {side === 'buy_rioz' ? (
            <TrendingUp className="h-5 w-5 text-green-500" />
          ) : (
            <TrendingDown className="h-5 w-5 text-red-500" />
          )}
          Ordem Limit - {side === 'buy_rioz' ? 'Comprar RIOZ' : 'Vender RIOZ'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Quantidade</Label>
          <div className="flex gap-2">
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              className="flex-1"
            />
            <Select value={inputCurrency} onValueChange={(value: 'BRL' | 'RIOZ') => setInputCurrency(value)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="RIOZ">RIOZ</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSwapCurrency}
              disabled={!preview}
            >
              ⇄
            </Button>
          </div>
        </div>

        {/* Limit Price */}
        <div className="space-y-2">
          <Label htmlFor="limitPrice">Preço Limite (BRL por RIOZ)</Label>
          <Input
            id="limitPrice"
            type="number"
            placeholder="0.0000"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            step="0.0001"
          />
          {currentPrice > 0 && (
            <p className="text-sm text-muted-foreground">
              Preço atual: {LimitOrderService.formatCurrency(currentPrice, 'BRL')} por RIOZ
            </p>
          )}
        </div>

        {/* Expiry */}
        <div className="space-y-2">
          <Label htmlFor="expiry">Expiração</Label>
          <Select value={expiresIn} onValueChange={(value: '1h' | '24h' | '7d') => setExpiresIn(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 hora</SelectItem>
              <SelectItem value="24h">24 horas</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Validation Error */}
        {!validation.isValid && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-sm text-destructive">{validation.error}</span>
          </div>
        )}

        {/* Insufficient Balance Warning */}
        {insufficientBalance && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">Saldo insuficiente</span>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium">Prévia da Ordem</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Você {side === 'buy_rioz' ? 'pagará' : 'receberá'}:</span>
                <p className="font-medium">
                  {LimitOrderService.formatCurrency(
                    side === 'buy_rioz' ? preview.amountBrl : preview.amountBrl, 
                    'BRL'
                  )}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Você {side === 'buy_rioz' ? 'receberá' : 'venderá'}:</span>
                <p className="font-medium">
                  {LimitOrderService.formatCurrency(preview.amountRioz, 'RIOZ')}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Taxa:</span>
                <p className="font-medium">
                  {side === 'buy_rioz' 
                    ? LimitOrderService.formatCurrency(preview.feeRioz, 'RIOZ')
                    : LimitOrderService.formatCurrency(preview.feeBrl, 'BRL')
                  }
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Impacto no preço:</span>
                <p className="font-medium">{preview.priceImpact}</p>
              </div>
            </div>
            
            {preview.estimatedReturn && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Retorno estimado vs preço atual:</span>
                  <Badge variant={preview.estimatedReturn.startsWith('+') ? 'default' : 'secondary'}>
                    {preview.estimatedReturn}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Create Order Button */}
        <Button
          onClick={handleCreateOrder}
          disabled={!preview || !validation.isValid || insufficientBalance || isCreating}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            'Criando Ordem...'
          ) : (
            <>
              <Clock className="mr-2 h-4 w-4" />
              Criar Ordem Limit
            </>
          )}
        </Button>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          Sua ordem será executada automaticamente quando o preço atingir o limite definido
        </p>
      </CardContent>
    </Card>
  );
};