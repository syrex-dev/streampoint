import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 select-none",
  {
    variants: {
      variant: {
        accent: "border-accent/35 bg-accent/10 text-accent-text",
        success: "border-accent/35 bg-accent/10 text-accent-text",
        default: "border-accent/35 bg-accent/10 text-accent-text",
        warning: "border-warning/30 bg-warning/10 text-warning",
        info: "border-info/30 bg-info/10 text-info",
        danger: "border-danger/30 bg-danger/10 text-danger",
        destructive: "border-danger/30 bg-danger/10 text-danger",
        neutral: "border-border-strong bg-surface-2 text-text-2",
        secondary: "border-border-strong bg-surface-2 text-text-2",
        outline: "border-border bg-transparent text-text-2",
      },
    },
    defaultVariants: {
      variant: "accent",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
