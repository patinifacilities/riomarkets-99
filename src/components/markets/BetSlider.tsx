import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface BetSliderProps {
  balance: number;
  onAmountChange: (amount: number) => void;
  estimatedReward: number;
}

export const BetSlider = ({ balance, onAmountChange, estimatedReward }: BetSliderProps) => {
  const [percentage, setPercentage] = useState([0]);
  
  const currentAmount = Math.floor((percentage[0] / 100) * balance);

  useEffect(() => {
    onAmountChange(currentAmount);
  }, [currentAmount, onAmountChange]);

  const handlePercentageClick = (percent: number) => {
    setPercentage([percent]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">Quantidade a apostar</Label>
        
        <div className="px-3 py-2 bg-muted/20 rounded-lg">
          <div className="text-lg font-semibold">
            {currentAmount} RIOZ
          </div>
          <div className="text-sm text-muted-foreground">
            Retorno estimado: {Math.floor(currentAmount * estimatedReward)} RIOZ
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Slider
          value={percentage}
          onValueChange={setPercentage}
          max={100}
          step={1}
          className="w-full"
        />
        
        <div className="flex justify-between gap-2">
          {[25, 50, 75, 100].map((percent) => (
            <Badge
              key={percent}
              variant={percentage[0] === percent ? "default" : "outline"}
              className={`cursor-pointer text-xs px-2 py-1 ${
                percentage[0] === percent 
                  ? "bg-[#00ff90] text-black hover:bg-[#00ff90]/90" 
                  : "hover:bg-muted"
              }`}
              onClick={() => handlePercentageClick(percent)}
            >
              {percent}%
            </Badge>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Disponível: {balance} RIOZ
        </div>
      </div>
    </div>
  );
};