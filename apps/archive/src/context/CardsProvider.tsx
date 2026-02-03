"use client"

import { ReactNode, useMemo, useState } from "react"

import { CardsContext } from "@/context/CardsContext"

export function CardsProvider({ children }: { children: ReactNode }) {
  const [focusedCard, setFocusedCard] = useState<string | null>(null)

  const value = useMemo(() => ({ focusedCard, setFocusedCard }), [focusedCard])

  return <CardsContext.Provider value={value}>{children}</CardsContext.Provider>
}
