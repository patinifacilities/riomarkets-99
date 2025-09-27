import { Progress } from '@/components/ui/progress';

interface PoolProgressBarProps {
  simPercent: number;
  naoPercent: number;
  className?: string;
}

const PoolProgressBar = ({ simPercent, naoPercent, className = "" }: PoolProgressBarProps) => {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#00FF91]"></div>
          <span className="text-[#00FF91] font-medium">SIM</span>
          <span className="text-muted-foreground">
            {simPercent.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
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