"use client"

import { cn } from "@/lib/utils"
import * as SelectPrimitive from "@radix-ui/react-select"
import { forwardRef } from "react"

/**
 * FlatSelect Component (Props 기반 Flat 패턴)
 *
 * Compound Component와 달리 모든 설정을 props로 전달합니다.
 * 단순한 사용 케이스에 적합하며, 보일러플레이트가 적습니다.
 *
 * @example
 * // 기본 사용
 * <FlatSelect
 *   value={value}
 *   onValueChange={setValue}
 *   placeholder="선택하세요"
 *   options={[
 *     { value: "react", label: "React" },
 *     { value: "vue", label: "Vue" },
 *   ]}
 * />
 *
 * @example
 * // 그룹 사용
 * <FlatSelect
 *   placeholder="기술 선택"
 *   groups={[
 *     {
 *       label: "프론트엔드",
 *       options: [
 *         { value: "react", label: "React" },
 *         { value: "vue", label: "Vue" },
 *       ],
 *     },
 *     {
 *       label: "백엔드",
 *       options: [
 *         { value: "node", label: "Node.js" },
 *         { value: "go", label: "Go" },
 *       ],
 *     },
 *   ]}
 * />
 */

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectGroup {
  label: string
  options: SelectOption[]
}

export interface FlatSelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  options?: SelectOption[]
  groups?: SelectGroup[]
  className?: string
  triggerClassName?: string
  contentClassName?: string
}

export const FlatSelect = forwardRef<HTMLButtonElement, FlatSelectProps>(
  ({ value, defaultValue, onValueChange, placeholder = "선택하세요", disabled = false, options, groups, className, triggerClassName, contentClassName }, ref) => {
    const hasGroups = groups && groups.length > 0
    const hasOptions = options && options.length > 0

    if (!hasGroups && !hasOptions) {
      console.warn("FlatSelect: options 또는 groups를 제공해야 합니다.")
      return null
    }

    return (
      <SelectPrimitive.Root value={value} defaultValue={defaultValue} onValueChange={onValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&>span]:line-clamp-1",
            className,
            triggerClassName
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDownIcon />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            className={cn(
              "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
              "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
              "data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
              contentClassName
            )}
          >
            <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
              <ChevronUpIcon />
            </SelectPrimitive.ScrollUpButton>

            <SelectPrimitive.Viewport className="p-1 h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]">
              {/* 단순 옵션 렌더링 */}
              {hasOptions &&
                !hasGroups &&
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </SelectItem>
                ))}

              {/* 그룹 렌더링 */}
              {hasGroups &&
                groups.map((group, index) => (
                  <div key={group.label}>
                    {index > 0 && <SelectPrimitive.Separator className="-mx-1 my-1 h-px bg-muted" />}
                    <SelectPrimitive.Group>
                      <SelectPrimitive.Label className="py-1.5 pl-8 pr-2 text-sm font-semibold">{group.label}</SelectPrimitive.Label>
                      {group.options.map((option) => (
                        <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectPrimitive.Group>
                  </div>
                ))}
            </SelectPrimitive.Viewport>

            <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
              <ChevronDownIcon />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    )
  }
)

FlatSelect.displayName = "FlatSelect"

// Internal Item Component
function SelectItem({ children, value, disabled }: { children: React.ReactNode; value: string; disabled?: boolean }) {
  return (
    <SelectPrimitive.Item
      value={value}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none",
        "focus:bg-accent focus:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}

// Icons
function ChevronDownIcon() {
  return (
    <svg
      className="h-4 w-4 opacity-50"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
