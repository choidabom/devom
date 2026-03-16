"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<"div"> {
  value?: number
}

function Progress({ className, value = 0, ...props }: ProgressProps) {
  return (
    <div data-slot="progress" className={cn("relative h-1 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <div data-slot="progress-indicator" className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export { Progress }
