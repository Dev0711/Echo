import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "border-[#252525] bg-[#1f1f1f] text-[#a1a1aa]",
        draft:       "border-[#252525] bg-[#1f1f1f] text-[#71717a]",
        published:   "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        scheduled:   "border-blue-500/20 bg-blue-500/10 text-blue-400",
        destructive: "border-red-500/20 bg-red-500/10 text-red-400",
        active:      "border-indigo-500/30 bg-indigo-500/10 text-indigo-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
