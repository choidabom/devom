"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { ChevronDownIcon } from "lucide-react"

interface AccordionContextValue {
  value: string[]
  toggleItem: (itemValue: string) => void
  type?: "single" | "multiple"
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

interface AccordionProps extends React.ComponentProps<"div"> {
  type?: "single" | "multiple"
  defaultValue?: string | string[]
  value?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

function Accordion({
  className,
  type = "single",
  defaultValue,
  value: controlledValue,
  onValueChange,
  ...props
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    }
    return []
  })

  const value = React.useMemo(() => {
    if (controlledValue) {
      return Array.isArray(controlledValue) ? controlledValue : [controlledValue]
    }
    return internalValue
  }, [controlledValue, internalValue])

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      const newValue =
        type === "single"
          ? value.includes(itemValue)
            ? []
            : [itemValue]
          : value.includes(itemValue)
            ? value.filter((v) => v !== itemValue)
            : [...value, itemValue]

      setInternalValue(newValue)
      onValueChange?.(type === "single" ? newValue[0] || "" : newValue)
    },
    [type, value, onValueChange]
  )

  return (
    <AccordionContext.Provider value={{ value, toggleItem, type }}>
      <div data-slot="accordion" className={cn("flex w-full flex-col", className)} {...props} />
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps extends React.ComponentProps<"div"> {
  value: string
}

const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean } | undefined>(
  undefined
)

function AccordionItem({ className, value, ...props }: AccordionItemProps) {
  const context = React.useContext(AccordionContext)
  if (!context) throw new Error("AccordionItem must be used within Accordion")

  const isOpen = context.value.includes(value)

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div data-slot="accordion-item" className={cn("border-b last:border-b-0", className)} {...props} />
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const accordionContext = React.useContext(AccordionContext)
  const itemContext = React.useContext(AccordionItemContext)

  if (!accordionContext || !itemContext)
    throw new Error("AccordionTrigger must be used within AccordionItem")

  return (
    <button
      type="button"
      data-slot="accordion-trigger"
      aria-expanded={itemContext.isOpen}
      onClick={() => accordionContext.toggleItem(itemContext.value)}
      className={cn(
        "flex flex-1 items-center justify-between rounded-lg border border-transparent py-2.5 text-left text-sm font-medium transition-all outline-none",
        "hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDownIcon
        data-slot="accordion-trigger-icon"
        className={cn(
          "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
          itemContext.isOpen && "rotate-180"
        )}
      />
    </button>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const itemContext = React.useContext(AccordionItemContext)
  if (!itemContext) throw new Error("AccordionContent must be used within AccordionItem")

  if (!itemContext.isOpen) return null

  return (
    <div
      data-slot="accordion-content"
      className={cn("overflow-hidden text-sm animate-in slide-in-from-top-2", className)}
      {...props}
    >
      <div className="pt-0 pb-2.5">{children}</div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
