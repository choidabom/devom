"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  defaultChecked?: boolean
  disabled?: boolean
  id?: string
  className?: string
  size?: "sm" | "default"
}

function Switch({ className, checked: controlledChecked, onCheckedChange, defaultChecked = false, disabled = false, id, size = "default" }: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked)
  const isChecked = controlledChecked ?? internalChecked

  const handleClick = () => {
    if (!disabled) {
      const next = !isChecked
      setInternalChecked(next)
      onCheckedChange?.(next)
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      id={id}
      onClick={handleClick}
      data-slot="switch"
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        size === "default" ? "h-[18.4px] w-[32px]" : "h-[14px] w-[24px]",
        isChecked ? "bg-primary" : "bg-muted-foreground/40",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <span
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background ring-0 transition-transform",
          size === "default" ? "h-4 w-4" : "h-3 w-3",
          isChecked ? (size === "default" ? "translate-x-[14px]" : "translate-x-[10px]") : "translate-x-0"
        )}
      />
    </button>
  )
}

export { Switch }
