import React from 'react';
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
  const maxValue = Math.max(...data.map(d => d.probability));
  
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
        <div className="h-64 w-full relative bg-muted/20 rounded-lg p-4">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-4">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          
          {/* Chart area */}
          <div className="ml-8 h-full relative">
            {/* Grid lines */}
            <div className="absolute inset-0">
              {[0, 25, 50, 75, 100].map((value) => (
                <div
                  key={value}
                  className="absolute w-full border-t border-border/30"
                  style={{ bottom: `${value}%` }}
                />
              ))}
            </div>
            
            {/* Data points and line */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00ff90" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#00ff90" stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Area under curve */}
              <path
                d={`M 0 ${100 - data[0].probability} ${data.map((point, i) => 
                  `L ${(i / (data.length - 1)) * 100} ${100 - point.probability}`
                ).join(' ')} L 100 100 L 0 100 Z`}
                fill="url(#gradient)"
              />
              
              {/* Line */}
              <path
                d={`M 0 ${100 - data[0].probability} ${data.map((point, i) => 
                  `L ${(i / (data.length - 1)) * 100} ${100 - point.probability}`
                ).join(' ')}`}
                fill="none"
                stroke="#00ff90"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              
              {/* Data points */}
              {data.map((point, i) => (
                <circle
                  key={i}
                  cx={(i / (data.length - 1)) * 100}
                  cy={100 - point.probability}
                  r="1"
                  fill="#00ff90"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
            
            {/* Tooltip on hover */}
            <div className="absolute inset-0 flex items-end justify-between px-2 pointer-events-none">
              {data.length > 1 && (
                <>
                  <div className="text-xs text-muted-foreground">
                    {data[0].date}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {data[data.length - 1].date}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#00ff90]"></div>
              <span>Probabilidade SIM</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff2389]"></div>
              <span>Probabilidade NÃO</span>
            </div>
          </div>
          <div className="text-right">
            <div>Atual: {data[data.length - 1]?.probability || 50}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProbabilityChart;