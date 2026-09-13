import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:   "bg-indigo-500 text-white hover:bg-indigo-400",
        outline:   "border border-[#252525] text-[#71717a] hover:border-[#3a3a3a] hover:text-[#d4d4d4] bg-transparent",
        ghost:     "text-[#71717a] hover:text-[#d4d4d4] hover:bg-white/[0.04] bg-transparent",
        destructive: "bg-red-500 text-white hover:bg-red-400",
        link:      "text-indigo-400 underline-offset-4 hover:underline bg-transparent",
      },
      size: {
        default: "px-3.5 py-1.5",
        sm:      "px-2.5 py-1 text-[12px]",
        lg:      "px-5 py-2 text-[14px]",
        icon:    "h-7 w-7 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
