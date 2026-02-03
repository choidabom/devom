import { useCallback, useEffect, useMemo, useState } from "react"

interface PortfolioState {
  tooltipVisible: boolean
  tooltipPosition: { x: number; y: number } | null
  tooltipMessage: string
  showCalendar: boolean
  minimizedCards: Array<{ index: number; id: string; img_url?: string }>
  contextMenu: { x: number; y: number } | null
}

interface PortfolioActions {
  handleShowTooltip: (position: { x: number; y: number }, message?: string) => void
  handleContextMenu: (e: React.MouseEvent) => void
  setTooltipVisible: (visible: boolean) => void
  setShowCalendar: (show: boolean) => void
  setMinimizedCards: (cards: Array<{ index: number; id: string; img_url?: string }>) => void
  setContextMenu: (menu: { x: number; y: number } | null) => void
}

export function usePortfolioState(): [PortfolioState, PortfolioActions] {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const [tooltipMessage, setTooltipMessage] = useState("Work in Progress")
  const [showCalendar, setShowCalendar] = useState(true)
  const [minimizedCards, setMinimizedCards] = useState<Array<{ index: number; id: string; img_url?: string }>>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)

  const handleShowTooltip = useCallback((position: { x: number; y: number }, message?: string) => {
    setTooltipPosition(position)
    setTooltipMessage(message || "Work in Progress")
    setTooltipVisible(true)
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if ((e.target as HTMLElement).closest(".card-container, .dock, .context-menu")) {
      return
    }
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  useEffect(() => {
    if (!tooltipVisible) return

    const timer = setTimeout(() => {
      setTooltipVisible(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [tooltipVisible])

  const state: PortfolioState = useMemo(
    () => ({
      tooltipVisible,
      tooltipPosition,
      tooltipMessage,
      showCalendar,
      minimizedCards,
      contextMenu,
    }),
    [tooltipVisible, tooltipPosition, tooltipMessage, showCalendar, minimizedCards, contextMenu]
  )

  const actions: PortfolioActions = useMemo(
    () => ({
      handleShowTooltip,
      handleContextMenu,
      setTooltipVisible,
      setShowCalendar,
      setMinimizedCards,
      setContextMenu,
    }),
    [handleShowTooltip, handleContextMenu]
  )

  return [state, actions]
}
