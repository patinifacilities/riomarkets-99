import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

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
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');

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

  const handlePlaceOrder = () => {
    if (!price || !amount) return;

    const newOrder: Order = {
      id: `order_${Date.now()}`,
      type: orderType,
      price: parseFloat(price),
      amount: parseFloat(amount),
      timestamp: Date.now()
    };

    setUserOrders(prev => [newOrder, ...prev].slice(0, 10)); // Keep last 10 orders

    // Add some mock matching logic
    if (orderType === 'buy') {
      setBuyOrders(prev => [
        { price: parseFloat(price), amount: parseFloat(amount), total: parseFloat(price) * parseFloat(amount) },
        ...prev
      ].sort((a, b) => b.price - a.price).slice(0, 5));
    } else {
      setSellOrders(prev => [
        { price: parseFloat(price), amount: parseFloat(amount), total: parseFloat(price) * parseFloat(amount) },
        ...prev
      ].sort((a, b) => a.price - b.price).slice(0, 5));
    }

    setPrice('');
    setAmount('');
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

            {/* Price Input */}
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

            {/* Amount Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>

            {/* Total */}
            {price && amount && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total</div>
                <div className="font-bold">{(parseFloat(price) * parseFloat(amount)).toFixed(2)} RZ</div>
              </div>
            )}

            {/* Place Order Button */}
            <Button
              onClick={handlePlaceOrder}
              disabled={!price || !amount}
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