import type { CSSProperties } from "react"
import type { SizingProps } from "../types"

export interface TailwindResult {
  style: Partial<CSSProperties>
  layout: {
    layoutMode?: "flex" | "grid"
    direction?: "row" | "column"
    gap?: number
    alignItems?: string
    justifyContent?: string
    sizing?: Partial<SizingProps>
    padding?: {
      top?: number
      right?: number
      bottom?: number
      left?: number
    }
  }
}

// Tailwind 4px scale
const SPACING: Record<string, number> = {
  "0": 0,
  "0.5": 2,
  "1": 4,
  "2": 8,
  "3": 12,
  "4": 16,
  "5": 20,
  "6": 24,
  "8": 32,
  "10": 40,
  "12": 48,
  "16": 64,
  "20": 80,
  "24": 96,
}

const SLATE_COLORS: Record<string, string> = {
  "50": "#f8fafc",
  "100": "#f1f5f9",
  "200": "#e2e8f0",
  "300": "#cbd5e1",
  "400": "#94a3b8",
  "500": "#64748b",
  "600": "#475569",
  "700": "#334155",
  "800": "#1e293b",
  "900": "#0f172a",
  "950": "#020617",
}

const GRAY_COLORS: Record<string, string> = {
  "50": "#f9fafb",
  "100": "#f3f4f6",
  "200": "#e5e7eb",
  "300": "#d1d5db",
  "400": "#9ca3af",
  "500": "#6b7280",
  "600": "#4b5563",
  "700": "#374151",
  "800": "#1f2937",
  "900": "#111827",
  "950": "#030712",
}

export function parseTailwindClasses(className: string): TailwindResult {
  const result: TailwindResult = {
    style: {},
    layout: {},
  }

  const classes = className.split(/\s+/).filter(Boolean)

  for (const cls of classes) {
    // Skip responsive/state variants
    if (cls.includes(":")) continue

    // Layout mode
    if (cls === "flex") {
      result.layout.layoutMode = "flex"
      result.layout.direction = "row"
    } else if (cls === "flex-col") {
      result.layout.layoutMode = "flex"
      result.layout.direction = "column"
    } else if (cls === "flex-row") {
      result.layout.layoutMode = "flex"
      result.layout.direction = "row"
    } else if (cls === "grid") {
      result.layout.layoutMode = "grid"
    }

    // Alignment
    else if (cls.startsWith("items-")) {
      const align = cls.slice(6)
      if (align === "start" || align === "center" || align === "end" || align === "stretch") {
        result.layout.alignItems = align
      }
    } else if (cls.startsWith("justify-")) {
      const justify = cls.slice(8)
      if (justify === "start" || justify === "center" || justify === "end" || justify === "between") {
        result.layout.justifyContent = justify === "between" ? "space-between" : justify
      }
    }

    // Gap
    else if (cls.startsWith("gap-")) {
      const val = cls.slice(4)
      if (SPACING[val] !== undefined) {
        result.layout.gap = SPACING[val]
      }
    }

    // Padding
    else if (cls.startsWith("p-")) {
      const val = cls.slice(2)
      if (SPACING[val] !== undefined) {
        const px = SPACING[val]
        result.layout.padding = { top: px, right: px, bottom: px, left: px }
      }
    } else if (cls.startsWith("px-")) {
      const val = cls.slice(3)
      if (SPACING[val] !== undefined) {
        const px = SPACING[val]
        if (!result.layout.padding) result.layout.padding = {}
        result.layout.padding.left = px
        result.layout.padding.right = px
      }
    } else if (cls.startsWith("py-")) {
      const val = cls.slice(3)
      if (SPACING[val] !== undefined) {
        const px = SPACING[val]
        if (!result.layout.padding) result.layout.padding = {}
        result.layout.padding.top = px
        result.layout.padding.bottom = px
      }
    } else if (cls.startsWith("pt-")) {
      const val = cls.slice(3)
      if (SPACING[val] !== undefined) {
        if (!result.layout.padding) result.layout.padding = {}
        result.layout.padding.top = SPACING[val]
      }
    } else if (cls.startsWith("pr-")) {
      const val = cls.slice(3)
      if (SPACING[val] !== undefined) {
        if (!result.layout.padding) result.layout.padding = {}
        result.layout.padding.right = SPACING[val]
      }
    } else if (cls.startsWith("pb-")) {
      const val = cls.slice(3)
      if (SPACING[val] !== undefined) {
        if (!result.layout.padding) result.layout.padding = {}
        result.layout.padding.bottom = SPACING[val]
      }
    } else if (cls.startsWith("pl-")) {
      const val = cls.slice(3)
      if (SPACING[val] !== undefined) {
        if (!result.layout.padding) result.layout.padding = {}
        result.layout.padding.left = SPACING[val]
      }
    }

    // Width
    else if (cls === "w-full") {
      result.layout.sizing = { ...result.layout.sizing, w: "fill" }
    }

    // Text size
    else if (cls === "text-xs") {
      result.style.fontSize = 12
    } else if (cls === "text-sm") {
      result.style.fontSize = 14
    } else if (cls === "text-base") {
      result.style.fontSize = 16
    } else if (cls === "text-lg") {
      result.style.fontSize = 18
    } else if (cls === "text-xl") {
      result.style.fontSize = 20
    } else if (cls === "text-2xl") {
      result.style.fontSize = 24
    } else if (cls === "text-3xl") {
      result.style.fontSize = 30
    } else if (cls === "text-4xl") {
      result.style.fontSize = 36
    } else if (cls === "text-5xl") {
      result.style.fontSize = 48
    } else if (cls === "text-6xl") {
      result.style.fontSize = 60
    }

    // Font weight
    else if (cls === "font-light") {
      result.style.fontWeight = 300
    } else if (cls === "font-normal") {
      result.style.fontWeight = 400
    } else if (cls === "font-medium") {
      result.style.fontWeight = 500
    } else if (cls === "font-semibold") {
      result.style.fontWeight = 600
    } else if (cls === "font-bold") {
      result.style.fontWeight = 700
    } else if (cls === "font-extrabold") {
      result.style.fontWeight = 800
    }

    // Text alignment
    else if (cls === "text-left") {
      result.style.textAlign = "left"
    } else if (cls === "text-center") {
      result.style.textAlign = "center"
    } else if (cls === "text-right") {
      result.style.textAlign = "right"
    }

    // Background color
    else if (cls === "bg-white") {
      result.style.backgroundColor = "#ffffff"
    } else if (cls === "bg-black") {
      result.style.backgroundColor = "#000000"
    } else if (cls.startsWith("bg-slate-")) {
      const shade = cls.slice(9)
      if (SLATE_COLORS[shade]) {
        result.style.backgroundColor = SLATE_COLORS[shade]
      }
    } else if (cls.startsWith("bg-gray-")) {
      const shade = cls.slice(8)
      if (GRAY_COLORS[shade]) {
        result.style.backgroundColor = GRAY_COLORS[shade]
      }
    }

    // Text color
    else if (cls.startsWith("text-slate-")) {
      const shade = cls.slice(11)
      if (SLATE_COLORS[shade]) {
        result.style.color = SLATE_COLORS[shade]
      }
    } else if (cls.startsWith("text-gray-")) {
      const shade = cls.slice(10)
      if (GRAY_COLORS[shade]) {
        result.style.color = GRAY_COLORS[shade]
      }
    }

    // Border
    else if (cls === "border") {
      result.style.border = "1px solid #e5e7eb"
    } else if (cls.startsWith("rounded-")) {
      const size = cls.slice(8)
      if (size === "none") result.style.borderRadius = 0
      else if (size === "sm") result.style.borderRadius = 2
      else if (size === "md") result.style.borderRadius = 6
      else if (size === "lg") result.style.borderRadius = 8
      else if (size === "xl") result.style.borderRadius = 12
      else if (size === "2xl") result.style.borderRadius = 16
      else if (size === "3xl") result.style.borderRadius = 24
      else if (size === "full") result.style.borderRadius = 9999
    } else if (cls === "rounded") {
      result.style.borderRadius = 4
    }

    // Shadow
    else if (cls === "shadow-sm") {
      result.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
    } else if (cls === "shadow") {
      result.style.boxShadow = "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)"
    } else if (cls === "shadow-md") {
      result.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
    } else if (cls === "shadow-lg") {
      result.style.boxShadow = "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
    } else if (cls === "shadow-xl") {
      result.style.boxShadow = "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    } else if (cls === "shadow-2xl") {
      result.style.boxShadow = "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
    }
  }

  return result
}
