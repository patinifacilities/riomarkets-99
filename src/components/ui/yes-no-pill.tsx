import { cn } from "@/lib/utils"

type PillProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "yes" | "no"
}

export function YesNoPill({ variant, className, ...props }: PillProps) {
  const base =
    "h-8 px-3 rounded-md text-sm font-medium transition-all duration-150 inline-flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none"
  const yes =
    "bg-success/15 text-success hover:bg-success/25 hover:shadow-success/20 border border-success/40"
  const no =
    "bg-danger/15 text-danger hover:bg-danger/25 hover:shadow-danger/20 border border-danger/40"

  return (
    <button className={cn(base, variant === "yes" ? yes : no, className)} {...props} />
  )
}