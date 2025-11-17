import { AnimatePresence, motion } from "framer-motion"
import "../../styles/tooltip.css"

interface TooltipProps {
  message: string
  isVisible: boolean
  position?: { x: number; y: number }
}

export const Tooltip = ({ message, isVisible, position }: TooltipProps) => {
  return (
    <AnimatePresence>
      {isVisible && position && (
        <motion.div
          className="tooltip"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
          style={{
            left: position.x,
            top: position.y,
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
