import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useOrderBookStore } from '@/stores/useOrderBookStore';

interface DepthDataPoint {
  price: number;
  buyDepth: number;
  sellDepth: number;
}

export const DepthChart = () => {
  const { orderBookData, fetchOrderBook } = useOrderBookStore();
  const [depthData, setDepthData] = useState<DepthDataPoint[]>([]);

  useEffect(() => {
    if (!orderBookData) {
      fetchOrderBook();
      return;
    }

    // Generate depth chart data from order book
    const combinedData: DepthDataPoint[] = [];
    
    // Process buy orders (bids) - cumulative from highest to lowest price
    let buyDepth = 0;
    const sortedBids = [...orderBookData.bids].sort((a, b) => b.price - a.price);
    
    sortedBids.forEach((bid) => {
      buyDepth += bid.quantity;
      combinedData.push({
        price: bid.price,
        buyDepth: buyDepth,
        sellDepth: 0
      });
    });

    // Process sell orders (asks) - cumulative from lowest to highest price  
    let sellDepth = 0;
    const sortedAsks = [...orderBookData.asks].sort((a, b) => a.price - b.price);
    
    sortedAsks.forEach((ask) => {
      sellDepth += ask.quantity;
      combinedData.push({
        price: ask.price,
        buyDepth: 0,
        sellDepth: sellDepth
      });
    });

    // Sort by price and fill gaps
    const sortedData = combinedData.sort((a, b) => a.price - b.price);
    
    // Fill in missing values
    let lastBuyDepth = 0;
    let lastSellDepth = 0;
    
    const filledData = sortedData.map((point) => {
      if (point.buyDepth > 0) lastBuyDepth = point.buyDepth;
      if (point.sellDepth > 0) lastSellDepth = point.sellDepth;
      
      return {
        price: point.price,
        buyDepth: point.buyDepth || lastBuyDepth,
        sellDepth: point.sellDepth || lastSellDepth
      };
    });

    setDepthData(filledData);
  }, [orderBookData, fetchOrderBook]);

  const formatPrice = (value: number) => {
    return `R$ ${value.toFixed(4)}`;
  };

  const formatDepth = (value: number) => {
    return `${value.toLocaleString()} RZ`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profundidade de Mercado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={depthData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="price" 
                tickFormatter={formatPrice}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `${value}`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number, name: string) => [
                  formatDepth(value), 
                  name === 'buyDepth' ? 'Compra' : 'Venda'
                ]}
                labelFormatter={formatPrice}
              />
              <Area
                type="stepAfter"
                dataKey="buyDepth"
                stackId="1"
                stroke="hsl(var(--success))"
                fill="hsl(var(--success))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Area
                type="stepBefore"
                dataKey="sellDepth"
                stackId="2"
                stroke="hsl(var(--danger))"
                fill="hsl(var(--danger))"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        <div className="flex justify-between mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded opacity-50"></div>
            <span>Ordens de Compra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-danger rounded opacity-50"></div>
            <span>Ordens de Venda</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};