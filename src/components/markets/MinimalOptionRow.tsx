import { OptionProgressBar } from '@/components/ui/option-progress-bar';
import { OptionMetrics } from '@/components/markets/OptionMetrics';
import { MarketOptionVariant } from '@/lib/market-colors';
import { cn } from '@/lib/utils';

interface MinimalOptionRowProps {
  label: string;
  percentage: number;
  bettors: number;
  pool?: number;
  recompensa?: number;
  variant: MarketOptionVariant;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

export function MinimalOptionRow({
  label,
  percentage,
  bettors,
  pool,
  recompensa,
  variant,
  onClick,
  disabled = false,
  ariaLabel
}: MinimalOptionRowProps) {
  const variantTextColors = {
    yes: "text-[#00FF91]",
    no: "text-[#FF1493]", 
    draw: "text-[#E8B100]",
    neutral: "text-[#FF1493]"
  };

  return (
    <div className="w-full">
      {/* Horizontal Layout: Label + Metrics + CTA */}
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={cn(
          "w-full h-12 flex items-center justify-between px-0 py-2 transition-all duration-200 text-left group min-h-[44px]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Left: Label */}
        <div className="flex-shrink-0 min-w-[60px]">
          <div className={cn(
            "text-sm font-semibold uppercase",
            variantTextColors[variant]
          )}>
            {label}
          </div>
          {/* Metrics below label */}
          <OptionMetrics 
            percentage={percentage}
            bettors={bettors}
            pool={pool}
            recompensa={recompensa}
            className="text-xs text-muted-foreground mt-0.5"
          />
        </div>

        {/* Right: CTA */}
        <div className="flex-shrink-0 min-w-[44px] flex justify-end">
          <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
            Analisar ↗
          </span>
        </div>
      </button>

      {/* Progress bar - Full width */}
      <div className="w-full mt-2">
        <OptionProgressBar 
          percentage={percentage} 
          variant={variant}
        />
      </div>
    </div>
  );
}