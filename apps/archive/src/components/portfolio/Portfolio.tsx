import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import "../../styles/portfolio.css"
import { Tooltip } from "../common/Tooltip"
import { Cards } from "./Cards"

export const Portfolio = () => {
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false)
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
    <motion.div className="portfolio-container">
      {/* <GuestbookIcon /> */}
      <Cards onShowTooltip={handleShowTooltip} />
      <Tooltip message="Work in Progress" isVisible={tooltipVisible} position={tooltipPosition || undefined} />
    </motion.div>
  )
}
