import { cn } from "@/lib/utils"

interface OptionProgressBarProps {
  percentage: number
  variant?: "yes" | "no" | "draw" | "neutral"
  className?: string
}

export function OptionProgressBar({ 
  percentage, 
  variant = "neutral", 
  className 
}: OptionProgressBarProps) {
  const variantClasses = {
    yes: "bg-[#00FF91] shadow-[#00FF91]/20",
    no: "bg-[#FF1493] shadow-[#FF1493]/20", 
    draw: "bg-[#E8B100] shadow-[#E8B100]/20",
    neutral: "bg-[#FF1493] shadow-[#FF1493]/20"
  }

  return (
    <div className={cn("w-full h-2 md:h-2.5 bg-[#2A2F36] overflow-hidden rounded-full", className)}>
      <div 
        className={cn(
          "h-full transition-[width] duration-500 rounded-full",
          variantClasses[variant],
          percentage > 0 && percentage < 5 ? "min-w-[4px]" : ""
        )}
        style={{ width: `${Math.min(Math.max(percentage || 0, 0), 100)}%` }}
      />
    </div>
  )
}