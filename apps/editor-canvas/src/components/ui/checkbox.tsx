import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  defaultChecked?: boolean
  disabled?: boolean
  id?: string
  className?: string
}

function Checkbox({ className, checked: controlledChecked, onCheckedChange, defaultChecked = false, disabled, id }: CheckboxProps) {
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
      role="checkbox"
      aria-checked={isChecked}
      disabled={disabled}
      id={id}
      onClick={handleClick}
      data-slot="checkbox"
      className={cn(
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-muted-foreground/40 transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isChecked && "border-primary bg-primary text-primary-foreground",
        className
      )}
    >
      {isChecked && <CheckIcon className="h-3 w-3" />}
    </button>
  )
}

export { Checkbox }
