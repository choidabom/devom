import { createContext } from "react"

export interface CardsContextType {
  focusedCard: string | null
  setFocusedCard: (id: string | null) => void
}

function throwContextError(): never {
  throw new Error("CardsContext not initialized. Wrap component with CardsProvider.")
}

const defaultCardsContext: CardsContextType = {
  focusedCard: null,
  setFocusedCard: throwContextError,
}

export const CardsContext = createContext<CardsContextType>(defaultCardsContext)
