import { formatPercent } from "@/lib/format"

interface OptionMetricsProps {
  percentage: number
  bettors: number
  pool?: number
  recompensa?: number
  className?: string
}

export function OptionMetrics({ percentage, bettors, pool, recompensa, className }: OptionMetricsProps) {
  const formatRecompensa = (value: number) => {
    return `${value.toFixed(2)}x`
  }

  return (
    <div className={`text-xs text-muted-foreground ${className || ''}`}>
      {formatPercent(percentage)} · {bettors} analistas · {recompensa ? formatRecompensa(recompensa) : '1.00x'} recompensa
    </div>
  )
}