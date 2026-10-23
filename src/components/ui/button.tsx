import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-[4px] font-medium text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs rounded-[4px] font-medium text-[13px] h-[34px] px-3 transition-colors",
        "stripe-actions":
          "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs rounded-[4px] font-medium text-[13px] h-[34px] px-3 transition-colors",
        outline:
          "bg-white text-text-secondary border border-border hover:bg-surface-subtle rounded-[4px] font-medium text-[13px] h-[34px] px-3",
        secondary:
          "bg-white text-text-secondary border border-border hover:bg-surface-subtle rounded-[4px] font-medium text-[13px] h-[34px] px-3",
        destructive:
          "bg-badge-danger-bg text-badge-danger-text border border-badge-danger-text/20 hover:bg-badge-danger-bg/80 rounded-[4px] font-medium text-[13px] h-[34px] px-3",
        ghost:
          "hover:bg-surface-subtle text-text-secondary hover:text-foreground rounded-[4px] font-medium text-[13px]",
        link:
          "text-link underline-offset-4 hover:underline p-0 h-auto font-medium text-[13px]",
      },
      size: {
        default: "h-[34px] px-3 text-[13px]",
        sm: "h-[28px] px-2.5 text-[12px]",
        lg: "h-[40px] px-4 text-[14px]",
        icon: "h-[34px] w-[34px] p-0",
      },
    },
    compoundVariants: [
      {
        variant: "link",
        className: "p-0 h-auto",
      },
    ],
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
