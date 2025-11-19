export const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const

// Drag and scroll behavior constants
export const DRAG_THRESHOLD = 5
export const SCROLL_MULTIPLIER = 1.5
export const MOMENTUM_MULTIPLIER = 15
export const DECELERATION_FACTOR = 0.95
export const MIN_VELOCITY = 0.1
export const MOMENTUM_THRESHOLD = 0.5
export const SCROLL_DELAY = 100

// Date parsing constants
export const MIN_MONTH = 1
export const MAX_MONTH = 12
export const MIN_DATE = 1
export const MAX_DATE = 31

export const getTodayInfo = () => {
  const today = new Date()
  return {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    date: today.getDate(),
  }
}

export const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate()

export const generateYearDays = (year: number) => {
  const days: Array<{ month: number; date: number; monthName: string }> = []

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = getDaysInMonth(year, month)
    for (let date = 1; date <= daysInMonth; date++) {
      days.push({ month, date, monthName: MONTH_NAMES[month - 1] || "" })
    }
  }

  return days
}
