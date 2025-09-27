import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProfile } from '@/hooks/useProfile';
import { useExchangeStore } from '@/stores/useExchangeStore';

export const BalanceDonutChart = () => {
  const { data: profile } = useProfile();
  const { balance } = useExchangeStore();

  const rzBalance = balance?.rioz_balance || 0;
  const brlBalance = balance?.brl_balance || 0;

  const data = [
    { name: 'RZ Coin', value: rzBalance, color: '#00FF91' },
    { name: 'Real (R$)', value: brlBalance, color: '#FF1493' }
  ];

  const total = rzBalance + brlBalance;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Distribuição de Saldo</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 space-y-2 w-full">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00FF91]"></div>
              <span className="text-sm">RZ Coin</span>
            </div>
            <span className="font-medium">{rzBalance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#FF1493]"></div>
              <span className="text-sm">Real (R$)</span>
            </div>
            <span className="font-medium">R$ {brlBalance.toFixed(2)}</span>
          </div>
          <div className="pt-2 border-t border-muted">
            <div className="flex justify-between items-center font-semibold">
              <span className="text-sm">Total Equivalente</span>
              <span>R$ {(rzBalance * 0.1 + brlBalance).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};