import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:h-4 [&_svg]:w-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-muted",
      },
      size: {
        default: "h-8 min-w-[2rem] px-2",
        sm: "h-7 min-w-[1.75rem] px-1.5 text-xs",
        lg: "h-9 min-w-[2.25rem] px-2.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToggleProps extends React.ComponentProps<"button">, VariantProps<typeof toggleVariants> {
  pressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}

function Toggle({
  className,
  variant = "default",
  size = "default",
  pressed,
  onPressedChange,
  ...props
}: ToggleProps) {
  const [internalPressed, setInternalPressed] = React.useState(false)
  const isPressed = pressed ?? internalPressed

  const handleClick = () => {
    const newPressed = !isPressed
    setInternalPressed(newPressed)
    onPressedChange?.(newPressed)
  }

  return (
    <button
      type="button"
      data-slot="toggle"
      aria-pressed={isPressed}
      onClick={handleClick}
      className={cn(
        toggleVariants({ variant, size }),
        isPressed && "bg-muted",
        className
      )}
      {...props}
    />
  )
}

export { Toggle, toggleVariants }
