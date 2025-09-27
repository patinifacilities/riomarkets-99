import { cn } from "@/lib/utils"

type BigProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: "yes" | "no"
}

export function YesNoBig({ variant, className, ...props }: BigProps) {
  const base =
    "w-full h-12 md:h-14 rounded-lg text-base md:text-lg font-semibold transition-all duration-150 shadow-sm active:scale-[0.99] disabled:opacity-50"
  const yes =
    "bg-success/10 text-success hover:bg-success/20 hover:shadow-success/30 hover:scale-105 border border-success/30"
  const no  =
    "bg-danger/10 text-danger hover:bg-danger/20 hover:shadow-danger/30 hover:scale-105 border border-danger/30"

  return (
    <button className={cn(base, variant === "yes" ? yes : no, className)} {...props} />
  )
}