import { cn } from "@/lib/utils"

type OutlineButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "yes" | "no" | "draw" | "neutral"
  percentage?: number
  showProgress?: boolean
}

export function OutlineButton({ 
  variant, 
  percentage = 0, 
  showProgress = false, 
  className, 
  children,
  ...props 
}: OutlineButtonProps) {
  const baseClasses = 
    "relative h-11 md:h-11 rounded-xl font-semibold uppercase transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:pointer-events-none overflow-hidden"
  
  const variantClasses = {
    yes: "bg-white dark:bg-[#181B22] text-[#167C3A] dark:text-[#29D17D] border-[1.5px] border-[#29D17D] hover:border-opacity-100 border-opacity-70",
    no: "bg-white dark:bg-[#181B22] text-[#A83232] dark:text-[#F16A6A] border-[1.5px] border-[#F16A6A] hover:border-opacity-100 border-opacity-70",
    draw: "bg-white dark:bg-[#181B22] text-[#8A6A00] dark:text-[#E8B100] border-[1.5px] border-[#E8B100] hover:border-opacity-100 border-opacity-70",
    neutral: "bg-white dark:bg-[#181B22] text-muted-foreground border-[1.5px] border-border hover:border-opacity-100 border-opacity-70"
  }

  const progressClasses = {
    yes: "bg-[#29D17D]",
    no: "bg-[#F16A6A]",
    draw: "bg-[#E8B100]",
    neutral: "bg-primary"
  }

  return (
    <button className={cn(baseClasses, variantClasses[variant], className)} {...props}>
      <div className="flex flex-col items-center gap-1">
        <span className="text-sm leading-none">{children}</span>
        {percentage !== undefined && (
          <span className="text-xs text-muted-foreground leading-none">
            {percentage}%
          </span>
        )}
      </div>
      
      {showProgress && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#EDF2F7] dark:bg-[#1F2430]">
          <div 
            className={cn("h-full transition-all duration-300", progressClasses[variant])}
            style={{ width: `${Math.min(percentage || 0, 100)}%` }}
          />
        </div>
      )}
    </button>
  )
}