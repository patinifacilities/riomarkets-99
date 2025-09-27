import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';
import { useExchangeStore } from '@/stores/useExchangeStore';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface Order {
  id: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  timestamp: number;
}

export const FunctionalOrderBook = () => {
  const [buyOrders, setBuyOrders] = useState<OrderBookEntry[]>([]);
  const [sellOrders, setSellOrders] = useState<OrderBookEntry[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [marketType, setMarketType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [sliderValue, setSliderValue] = useState([0]);
  const { balance } = useExchangeStore();

  // Initialize with mock data
  useEffect(() => {
    const initialBuyOrders: OrderBookEntry[] = [
      { price: 0.95, amount: 1000, total: 950 },
      { price: 0.92, amount: 1500, total: 1380 },
      { price: 0.90, amount: 2000, total: 1800 },
      { price: 0.88, amount: 1200, total: 1056 },
      { price: 0.85, amount: 800, total: 680 },
    ];

    const initialSellOrders: OrderBookEntry[] = [
      { price: 1.05, amount: 800, total: 840 },
      { price: 1.08, amount: 1200, total: 1296 },
      { price: 1.10, amount: 2000, total: 2200 },
      { price: 1.12, amount: 1500, total: 1680 },
      { price: 1.15, amount: 1000, total: 1150 },
    ];

    setBuyOrders(initialBuyOrders);
    setSellOrders(initialSellOrders);
  }, []);

  const handleSliderChange = (value: number[]) => {
    setSliderValue(value);
    const percentage = value[0] / 100;
    
    if (orderType === 'buy' && balance?.brl_balance) {
      const maxAmount = balance.brl_balance * percentage;
      setAmount(maxAmount.toFixed(2));
    } else if (orderType === 'sell' && balance?.rioz_balance) {
      const maxAmount = balance.rioz_balance * percentage;
      setAmount(maxAmount.toFixed(2));
    }
  };

  const handlePlaceOrder = async () => {
    if (!amount || (marketType === 'limit' && !price)) return;

    const orderPrice = marketType === 'market' 
      ? (orderType === 'buy' ? sellOrders[0]?.price || 1.0 : buyOrders[0]?.price || 1.0)
      : parseFloat(price);

    const newOrder: Order = {
      id: `order_${Date.now()}`,
      type: orderType,
      price: orderPrice,
      amount: parseFloat(amount),
      timestamp: Date.now()
    };

    // Se é ordem de mercado, executar imediatamente através do exchange store
    if (marketType === 'market') {
      try {
        const side = orderType === 'buy' ? 'buy_rioz' : 'sell_rioz';
        const inputCurrency = orderType === 'buy' ? 'BRL' : 'RIOZ';
        await useExchangeStore.getState().performExchange(side, parseFloat(amount), inputCurrency);
        
        // Clear form after successful execution
        setPrice('');
        setAmount('');
        setSliderValue([0]);
        return;
      } catch (error) {
        console.error('Erro ao executar ordem de mercado:', error);
        return;
      }
    }

    setUserOrders(prev => [newOrder, ...prev].slice(0, 10));

    // Enhanced matching logic
    if (orderType === 'buy') {
      const newBuyOrder = { price: orderPrice, amount: parseFloat(amount), total: orderPrice * parseFloat(amount) };
      
      // Check for matching sell orders
      const matchingSells = sellOrders.filter(sell => sell.price <= orderPrice);
      if (matchingSells.length > 0) {
        let remainingAmount = parseFloat(amount);
        const updatedSells = [...sellOrders];
        
        for (const sell of matchingSells) {
          if (remainingAmount <= 0) break;
          
          if (sell.amount <= remainingAmount) {
            remainingAmount -= sell.amount;
            const sellIndex = updatedSells.findIndex(s => s.price === sell.price && s.amount === sell.amount);
            if (sellIndex !== -1) updatedSells.splice(sellIndex, 1);
          } else {
            const sellIndex = updatedSells.findIndex(s => s.price === sell.price && s.amount === sell.amount);
            if (sellIndex !== -1) {
              updatedSells[sellIndex].amount -= remainingAmount;
              updatedSells[sellIndex].total = updatedSells[sellIndex].price * updatedSells[sellIndex].amount;
            }
            remainingAmount = 0;
          }
        }
        
        setSellOrders(updatedSells);
        
        if (remainingAmount > 0) {
          setBuyOrders(prev => [
            { ...newBuyOrder, amount: remainingAmount, total: orderPrice * remainingAmount },
            ...prev
          ].sort((a, b) => b.price - a.price).slice(0, 5));
        }
      } else {
        setBuyOrders(prev => [newBuyOrder, ...prev].sort((a, b) => b.price - a.price).slice(0, 5));
      }
    } else {
      const newSellOrder = { price: orderPrice, amount: parseFloat(amount), total: orderPrice * parseFloat(amount) };
      
      // Check for matching buy orders
      const matchingBuys = buyOrders.filter(buy => buy.price >= orderPrice);
      if (matchingBuys.length > 0) {
        let remainingAmount = parseFloat(amount);
        const updatedBuys = [...buyOrders];
        
        for (const buy of matchingBuys) {
          if (remainingAmount <= 0) break;
          
          if (buy.amount <= remainingAmount) {
            remainingAmount -= buy.amount;
            const buyIndex = updatedBuys.findIndex(b => b.price === buy.price && b.amount === buy.amount);
            if (buyIndex !== -1) updatedBuys.splice(buyIndex, 1);
          } else {
            const buyIndex = updatedBuys.findIndex(b => b.price === buy.price && b.amount === buy.amount);
            if (buyIndex !== -1) {
              updatedBuys[buyIndex].amount -= remainingAmount;
              updatedBuys[buyIndex].total = updatedBuys[buyIndex].price * updatedBuys[buyIndex].amount;
            }
            remainingAmount = 0;
          }
        }
        
        setBuyOrders(updatedBuys);
        
        if (remainingAmount > 0) {
          setSellOrders(prev => [
            { ...newSellOrder, amount: remainingAmount, total: orderPrice * remainingAmount },
            ...prev
          ].sort((a, b) => a.price - b.price).slice(0, 5));
        }
      } else {
        setSellOrders(prev => [newSellOrder, ...prev].sort((a, b) => a.price - b.price).slice(0, 5));
      }
    }

    setPrice('');
    setAmount('');
    setSliderValue([0]);
  };

  const spread = sellOrders.length > 0 && buyOrders.length > 0 
    ? sellOrders[0].price - buyOrders[0].price 
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Order Book */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5" />
              Order Book
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Spread */}
            <div className="text-center py-2 border border-border rounded-lg">
              <div className="text-sm text-muted-foreground">Spread</div>
              <div className="font-bold">{spread.toFixed(4)} RZ</div>
            </div>

            {/* Sell Orders */}
            <div>
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Preço (RZ)</span>
                <span>Quantidade</span>
                <span>Total (RZ)</span>
              </div>
              <div className="space-y-1">
                {sellOrders.map((order, index) => (
                  <div key={index} className="flex justify-between text-sm bg-danger/10 p-2 rounded">
                    <span className="text-danger font-medium">{order.price.toFixed(4)}</span>
                    <span>{order.amount.toLocaleString()}</span>
                    <span>{order.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Buy Orders */}
            <div>
              <div className="space-y-1">
                {buyOrders.map((order, index) => (
                  <div key={index} className="flex justify-between text-sm bg-success/10 p-2 rounded">
                    <span className="text-success font-medium">{order.price.toFixed(4)}</span>
                    <span>{order.amount.toLocaleString()}</span>
                    <span>{order.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Place Order */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Fazer Ordem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Order Type Toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={orderType === 'buy' ? 'default' : 'outline'}
                onClick={() => setOrderType('buy')}
                className={orderType === 'buy' ? 'bg-success hover:bg-success/90' : ''}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Comprar
              </Button>
              <Button
                variant={orderType === 'sell' ? 'default' : 'outline'}
                onClick={() => setOrderType('sell')}
                className={orderType === 'sell' ? 'bg-danger hover:bg-danger/90' : ''}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Vender
              </Button>
            </div>

            {/* Market Type Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Ordem</label>
              <Select value={marketType} onValueChange={(value: 'market' | 'limit') => setMarketType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">Mercado</SelectItem>
                  <SelectItem value="limit">Limite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Input */}
            {marketType === 'limit' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço (RZ)</label>
                <Input
                  type="number"
                  step="0.0001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.0000"
                />
              </div>
            )}

            {/* Balance Slider */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Saldo Disponível: {orderType === 'buy' 
                  ? `R$ ${balance?.brl_balance?.toFixed(2) || '0.00'}` 
                  : `${balance?.rioz_balance?.toFixed(2) || '0.00'} RZ`
                }
              </label>
              <Slider
                value={sliderValue}
                onValueChange={handleSliderChange}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Quantidade {orderType === 'buy' ? '(R$)' : '(RZ)'}
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Total */}
            {amount && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">
                  {orderType === 'buy' ? 'RZ a receber' : 'R$ a receber'}
                </div>
                <div className="font-bold">
                  {orderType === 'buy' 
                    ? `${(parseFloat(amount) / (sellOrders[0]?.price || 1)).toFixed(4)} RZ`
                    : `R$ ${(parseFloat(amount) * (buyOrders[0]?.price || 1)).toFixed(2)}`
                  }
                </div>
              </div>
            )}

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              disabled={!amount || (marketType === 'limit' && !price)}
              className="w-full"
            >
              {orderType === 'buy' ? 'Comprar' : 'Vender'}
            </Button>
          </CardContent>
        </Card>

        {/* User Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Minhas Ordens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userOrders.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  Nenhuma ordem ativa
                </div>
              ) : (
                userOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-2 border border-border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={order.type === 'buy' ? 'default' : 'destructive'}>
                        {order.type === 'buy' ? 'COMPRA' : 'VENDA'}
                      </Badge>
                      <span className="text-sm">{order.amount} @ {order.price.toFixed(4)}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Cancelar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};