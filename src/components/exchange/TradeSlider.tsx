import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface TradeSliderProps {
  balance: number;
  currency: string;
  price?: number;
  onAmountChange: (amount: number) => void;
  side: 'buy' | 'sell';
}

export const TradeSlider = ({ balance, currency, price = 1, onAmountChange, side }: TradeSliderProps) => {
  const [percentage, setPercentage] = useState([0]);
  
  // For 100% purchases, calculate with fee deduction
  const calculateMaxAmount = () => {
    if (side === 'buy') {
      if (percentage[0] === 100) {
        // For 100%, deduct 2% fee from available RIOZ first, then calculate BRL amount
        const availableAfterFee = balance / 1.02; // Reverse the 2% fee to get true 100%
        return availableAfterFee;
      }
      return balance;
    }
    // For selling, allow 100% but fee will be deducted from the amount
    return balance;
  };
  
  const maxAmount = calculateMaxAmount();
  const currentAmount = (percentage[0] / 100) * maxAmount;

  useEffect(() => {
    onAmountChange(currentAmount);
  }, [currentAmount, onAmountChange]);

  const handlePercentageClick = (percent: number) => {
    setPercentage([percent]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm">
          {side === 'buy' ? 'Quanto comprar' : 'Quanto vender'}
        </Label>
        
        <div className="px-3 py-2 bg-muted/20 rounded-lg">
          <div className="text-lg font-semibold">
            {currentAmount.toFixed(2)} {side === 'buy' ? 'RIOZ' : 'RIOZ'}
          </div>
          <div className="text-sm text-muted-foreground">
            {side === 'buy' ? 
              `Custo: ${currentAmount.toFixed(2)} RIOZ` : 
              `≈ R$ ${(currentAmount * price).toFixed(2)}`
            }
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
              className="cursor-pointer text-xs px-2 py-1"
              onClick={() => handlePercentageClick(percent)}
            >
              {percent}%
            </Badge>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground text-center">
          Disponível: {balance.toFixed(2)} {side === 'buy' ? 'RIOZ' : 'RIOZ'}
        </div>
      </div>
    </div>
  );
};