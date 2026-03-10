import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
}

function Checkbox({ className, checked = false, onCheckedChange, disabled, id }: CheckboxProps) {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange?.(!checked)
    }
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      id={id}
      onClick={handleClick}
      data-slot="checkbox"
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-muted-foreground/40 transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked && "border-primary bg-primary text-primary-foreground",
        className
      )}
    >
      {checked && <CheckIcon className="h-3 w-3" />}
    </button>
  )
}

export { Checkbox }
