import { createContext } from "react"

export interface CardsContextType {
  focusedCard: string | null
  setFocusedCard: (id: string | null) => void
}

export const defaultFocusedCard: CardsContextType = {
  focusedCard: null,
  setFocusedCard: () => {},
}

export const CardsContext = createContext<CardsContextType>(defaultFocusedCard)
