import React, { useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrderBookStore } from '@/stores/useOrderBookStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '@/lib/currency';

interface DepthChartData {
  price: number;
  buyDepth: number;
  sellDepth: number;
  side: 'buy' | 'sell';
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isBuy = data.side === 'buy';
    
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-mono font-semibold mb-1">
          {formatCurrency(label, 'BRL')}
        </p>
        <p className={`text-sm ${isBuy ? 'text-green-400' : 'text-red-400'}`}>
          {isBuy ? 'Compra' : 'Venda'}: {data[isBuy ? 'buyDepth' : 'sellDepth'].toLocaleString()} RIOZ
        </p>
      </div>
    );
  }
  return null;
};

export const DepthChart: React.FC<{ height?: number }> = ({ height = 300 }) => {
  const {
    depthData,
    depthLoading,
    depthError,
    orderBookData,
    startRealTimeUpdates
  } = useOrderBookStore();

  // Start real-time updates on mount
  useEffect(() => {
    const cleanup = startRealTimeUpdates();
    return cleanup;
  }, [startRealTimeUpdates]);

  // Process depth data for chart
  const chartData = useMemo(() => {
    if (!depthData || !orderBookData) return [];

    const data: DepthChartData[] = [];
    
    // Add buy side data (reversed to show from current price outward)
    depthData.buy_depth.forEach(point => {
      data.push({
        price: point.price,
        buyDepth: point.cumulative_quantity,
        sellDepth: 0,
        side: 'buy'
      });
    });
    
    // Add sell side data
    depthData.sell_depth.forEach(point => {
      data.push({
        price: point.price,
        buyDepth: 0,
        sellDepth: point.cumulative_quantity,
        side: 'sell'
      });
    });
    
    // Sort by price
    return data.sort((a, b) => a.price - b.price);
  }, [depthData, orderBookData]);

  if (depthLoading && !depthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profundidade de Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full" style={{ height }} />
        </CardContent>
      </Card>
    );
  }

  if (depthError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-red-400">Erro no Gráfico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">{depthError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profundidade de Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-muted-foreground">Nenhum dado disponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Profundidade de Mercado</CardTitle>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-sm" />
            <span>Ordens de Compra</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-sm" />
            <span>Ordens de Venda</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="buyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="sellGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
            <XAxis 
              dataKey="price" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => formatCurrency(value, 'BRL')}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="stepAfter"
              dataKey="buyDepth"
              stroke="hsl(var(--chart-2))"
              fillOpacity={1}
              fill="url(#buyGradient)"
              strokeWidth={2}
            />
            <Area
              type="stepBefore"
              dataKey="sellDepth"
              stroke="hsl(var(--destructive))"
              fillOpacity={1}
              fill="url(#sellGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {orderBookData && (
          <div className="mt-4 flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Preço Atual</div>
              <div className="font-mono font-bold text-lg">
                {formatCurrency(orderBookData.last_price, 'BRL')}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};