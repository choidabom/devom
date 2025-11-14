import { motion } from "framer-motion"
import { useState } from "react"
import { defaultFocusedCard } from "../../context/CardsContext"
import "../../styles/portfolio.css"
import { Cards } from "./Cards"

export const Portfolio = () => {
  const [focusedCard, setFocusedCard] = useState<string | null>(defaultFocusedCard.focusedCard)

  return (
    <motion.div className="portfolio-container" onHoverStart={() => setFocusedCard(null)}>
      <Cards />
    </motion.div>
  )
}
