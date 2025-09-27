import { Progress } from '@/components/ui/progress';

interface PoolProgressBarProps {
  simPercent: number;
  naoPercent: number;
  className?: string;
  showOdds?: boolean;
  simOdds?: number;
  naoOdds?: number;
}

const PoolProgressBar = ({ simPercent, naoPercent, className = "", showOdds = false, simOdds = 1.5, naoOdds = 1.5 }: PoolProgressBarProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#00FF91]"></div>
          <span className="text-[#00FF91] font-medium">SIM</span>
          <span className="text-muted-foreground">
            {simPercent.toFixed(1)}%
          </span>
          {showOdds && (
            <span className="text-[#00FF91] font-semibold text-xs bg-[#00FF91]/10 px-2 py-1 rounded">
              {simOdds.toFixed(2)}x
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showOdds && (
            <span className="text-[#FF1493] font-semibold text-xs bg-[#FF1493]/10 px-2 py-1 rounded">
              {naoOdds.toFixed(2)}x
            </span>
          )}
          <span className="text-muted-foreground">
            {naoPercent.toFixed(1)}%
          </span>
          <span className="text-[#FF1493] font-medium">NÃO</span>
          <div className="w-3 h-3 rounded-full bg-[#FF1493]"></div>
        </div>
      </div>
      
      <div className="relative">
        <Progress 
          value={simPercent} 
          className="h-2 bg-[#2A2F36]"
        />
        <div className="absolute inset-0 h-2 bg-[#00FF91] rounded-full transition-[width] duration-500" 
             style={{ 
               width: `${simPercent}%`,
               minWidth: simPercent > 0 && simPercent < 5 ? '4px' : '0'
             }} />
      </div>
    </div>
  );
};

export default PoolProgressBar;