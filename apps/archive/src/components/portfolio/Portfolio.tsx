import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { defaultFocusedCard } from "../../context/CardsContext"
import "../../styles/portfolio.css"
import { Cards } from "./Cards"

export const Portfolio = () => {
  const [focusedCard, setFocusedCard] = useState<string | null>(defaultFocusedCard.focusedCard)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)

  const handleShowTooltip = (position: { x: number; y: number }) => {
    setTooltipPosition(position)
    setTooltipVisible(true)
  }

  useEffect(() => {
    if (tooltipVisible) {
      const timer = setTimeout(() => {
        setTooltipVisible(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [tooltipVisible])

  return (
    <motion.div className="portfolio-container" onHoverStart={() => setFocusedCard(null)}>
      {/* <GuestbookIcon /> */}
      <Cards onShowTooltip={handleShowTooltip} />
    </motion.div>
  )
}
