import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

interface ProbabilityChartProps {
  marketId: string;
  createdAt: string;
}

// Mock data generator for probability history
const generateMockData = (createdAt: string) => {
  const startDate = new Date(createdAt);
  const endDate = new Date();
  const data = [];
  
  let currentProb = 50; // Start at 50%
  const totalDays = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  for (let i = 0; i <= Math.min(totalDays, 30); i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    
    // Add some realistic fluctuation
    const change = (Math.random() - 0.5) * 10; // ±5% change
    currentProb = Math.max(10, Math.min(90, currentProb + change));
    
    data.push({
      date: date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
      probability: Math.round(currentProb),
      timestamp: date.getTime()
    });
  }
  
  return data;
};

const ProbabilityChart: React.FC<ProbabilityChartProps> = ({ marketId, createdAt }) => {
  const data = generateMockData(createdAt);
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-primary" />
          Histórico de Probabilidade
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Evolução da probabilidade "SIM" ao longo do tempo
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
              />
              <YAxis 
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickLine={{ stroke: 'currentColor', opacity: 0.3 }}
                label={{ value: 'Probabilidade (%)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-sm text-primary">
                          Probabilidade SIM: {payload[0].value}%
                        </p>
                        <p className="text-sm text-[#ff2389]">
                          Probabilidade NÃO: {100 - (payload[0].value as number)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="probability" 
                stroke="#00ff90"
                strokeWidth={3}
                dot={{ fill: '#00ff90', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#00ff90', strokeWidth: 2, fill: '#00ff90' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>Início do mercado</span>
          <span>Agora</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProbabilityChart;