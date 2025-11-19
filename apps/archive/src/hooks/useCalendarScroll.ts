import { useCallback, useEffect } from "react"
import { getDaysInMonth, SCROLL_DELAY } from "../constants/calendar"

interface TodayInfo {
  year: number
  month: number
  date: number
}

/**
 * Calendar auto-scroll to today hook
 *
 * Automatically scrolls the calendar timeline to center today's date on mount.
 * Only scrolls if the calendar year matches the current year.
 *
 * @param scrollContainerRef - Ref to the scrollable calendar container
 * @param year - The year displayed in the calendar
 * @param today - Today's date info (year, month, date)
 */
export const useCalendarScroll = (
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  year: number,
  today: TodayInfo
) => {
  const scrollToToday = useCallback(() => {
    if (!scrollContainerRef.current || year !== today.year) return

    let todayIndex = 0
    for (let month = 1; month < today.month; month++) {
      todayIndex += getDaysInMonth(year, month)
    }
    todayIndex += today.date - 1

    const dayElements = scrollContainerRef.current.querySelectorAll(".calendar-timeline-day")
    const todayElement = dayElements[todayIndex] as HTMLElement
    if (!todayElement) return

    const containerWidth = scrollContainerRef.current.offsetWidth
    const scrollPosition = todayElement.offsetLeft - containerWidth / 2 + todayElement.offsetWidth / 2

    scrollContainerRef.current.scrollTo({
      left: scrollPosition,
      behavior: "smooth",
    })
  }, [scrollContainerRef, year, today.year, today.month, today.date])

  useEffect(() => {
    const timer = setTimeout(scrollToToday, SCROLL_DELAY)
    return () => clearTimeout(timer)
  }, [scrollToToday])
}
