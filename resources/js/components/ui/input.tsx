import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  hasError?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-muted transition-colors outline-none",
          "focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          (hasError || props["aria-invalid"]) &&
            "border-danger focus-visible:border-danger focus-visible:ring-danger/30",
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
