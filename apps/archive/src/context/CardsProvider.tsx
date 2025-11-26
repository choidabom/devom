"use client"

import { ReactNode, useState } from "react"
import { CardsContext } from "./CardsContext"

export function CardsProvider({ children }: { children: ReactNode }) {
  const [focusedCard, setFocusedCard] = useState<string | null>(null)

  return <CardsContext.Provider value={{ focusedCard, setFocusedCard }}>{children}</CardsContext.Provider>
}
