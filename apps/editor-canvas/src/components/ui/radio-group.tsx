import * as React from "react"
import { cn } from "@/lib/utils"

interface RadioGroupContextValue {
  value: string
  onValueChange: (value: string) => void
}

const RadioGroupContext = React.createContext<RadioGroupContextValue | undefined>(undefined)

interface RadioGroupProps extends React.ComponentProps<"div"> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

function RadioGroup({ className, value: controlledValue, onValueChange, defaultValue, ...props }: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "")
  const value = controlledValue ?? internalValue

  const handleValueChange = React.useCallback(
    (newValue: string) => {
      setInternalValue(newValue)
      onValueChange?.(newValue)
    },
    [onValueChange]
  )

  return (
    <RadioGroupContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div data-slot="radio-group" role="radiogroup" className={cn("grid w-full gap-2", className)} {...props} />
    </RadioGroupContext.Provider>
  )
}

interface RadioGroupItemProps extends Omit<React.ComponentProps<"button">, "value"> {
  value: string
}

function RadioGroupItem({ className, value: itemValue, ...props }: RadioGroupItemProps) {
  const context = React.useContext(RadioGroupContext)
  if (!context) throw new Error("RadioGroupItem must be used within RadioGroup")

  const isChecked = context.value === itemValue

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isChecked}
      data-slot="radio-group-item"
      onClick={() => context.onValueChange(itemValue)}
      className={cn(
        "peer relative flex aspect-square h-4 w-4 shrink-0 rounded-full border border-input outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isChecked && "border-primary bg-primary text-primary-foreground",
        className
      )}
      {...props}
    >
      {isChecked && <span data-slot="radio-group-indicator" className="absolute top-1/2 left-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground" />}
    </button>
  )
}

export { RadioGroup, RadioGroupItem }
