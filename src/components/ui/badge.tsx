import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[11px] font-semibold tracking-normal transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-badge-info-bg text-badge-info-text",
        info:
          "border-transparent bg-badge-info-bg text-badge-info-text",
        success:
          "border-transparent bg-badge-success-bg text-badge-success-text",
        warning:
          "border-transparent bg-badge-warning-bg text-badge-warning-text",
        destructive:
          "border-transparent bg-badge-danger-bg text-badge-danger-text",
        danger:
          "border-transparent bg-badge-danger-bg text-badge-danger-text",
        outline:
          "border-border bg-white text-text-muted",
        secondary:
          "border-border bg-surface-subtle text-text-secondary",
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
