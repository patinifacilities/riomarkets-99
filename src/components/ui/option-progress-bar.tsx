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
    <div className={cn("w-full h-2 md:h-2.5 bg-[#2A2F36] overflow-hidden rounded-full relative", className)}>
      <div 
        className={cn(
          "h-full transition-all duration-700 ease-out rounded-full relative",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
          "before:animate-[shimmer_2s_ease-in-out_infinite]",
          variantClasses[variant],
          percentage > 0 && percentage < 5 ? "min-w-[4px]" : ""
        )}
        style={{ width: `${Math.min(Math.max(percentage || 0, 0), 100)}%` }}
      />
    </div>
  )
}