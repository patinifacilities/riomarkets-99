import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity } from 'lucide-react';

interface SimpleOrderBookProps {
  marketId: string;
  simPercent: number;
  naoPercent: number;
  simOdds: number;
  naoOdds: number;
}

const SimpleOrderBook = ({ marketId, simPercent, naoPercent, simOdds, naoOdds }: SimpleOrderBookProps) => {
  return (
    <Card className="bg-gradient-card border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Order Book - Mercado de Opiniões
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Probabilidades atuais do mercado
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* SIM Order Line */}
        <div className="p-3 rounded border border-[#00FF91]/20 bg-[#00FF91]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#00FF91] font-semibold">SIM</span>
              <span className="text-sm text-muted-foreground">({simPercent.toFixed(1)}%)</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#00FF91]">{simOdds.toFixed(2)}x</div>
              <div className="text-xs text-muted-foreground">odds</div>
            </div>
          </div>
        </div>

        {/* Market Separator */}
        <div className="border-y border-border py-2 text-center">
          <div className="text-sm text-muted-foreground">
            Spread do mercado
          </div>
        </div>

        {/* NÃO Order Line */}
        <div className="p-3 rounded border border-[#FF1493]/20 bg-[#FF1493]/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[#FF1493] font-semibold">NÃO</span>
              <span className="text-sm text-muted-foreground">({naoPercent.toFixed(1)}%)</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-[#FF1493]">{naoOdds.toFixed(2)}x</div>
              <div className="text-xs text-muted-foreground">odds</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleOrderBook;