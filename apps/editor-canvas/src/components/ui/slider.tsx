import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps extends Omit<React.ComponentProps<"input">, "type" | "value" | "onChange" | "defaultValue"> {
  defaultValue?: number[]
  value?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

function Slider({ className, defaultValue, value, onValueChange, min = 0, max = 100, step = 1, disabled, ...props }: SliderProps) {
  const initialValue = value?.[0] ?? defaultValue?.[0] ?? min

  return (
    <input
      type="range"
      data-slot="slider"
      className={cn(
        "w-full h-1 rounded-full appearance-none cursor-pointer",
        "bg-muted",
        "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-ring [&::-webkit-slider-thumb]:cursor-pointer",
        "[&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-ring [&::-moz-range-thumb]:cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      defaultValue={initialValue}
      value={value?.[0]}
      onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
      {...props}
    />
  )
}

export { Slider }
