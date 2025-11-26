import { useEffect, useState } from "react"

/**
 * Debounce utility function
 * @param func Function to debounce
 * @param wait Wait time in milliseconds
 * @returns Debounced function with cancel method
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T & { cancel: () => void } {
  let timeout: ReturnType<typeof setTimeout> | null = null

  const debounced = function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  } as T & { cancel: () => void }

  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debounced
}

/**
 * Hook to track window size with debouncing to prevent excessive re-renders
 * @param debounceMs Debounce delay in milliseconds (default: 150ms)
 * @returns Current window dimensions
 */
export const useWindowSize = (debounceMs = 150): { width: number; height: number } => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  })

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleWindowResize = (): void => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // Debounce resize handler to improve performance
    const debouncedResize = debounce(handleWindowResize, debounceMs)

    // resize event: only occurs on the window object and fires continuously when the browser window is resized
    window.addEventListener("resize", debouncedResize)

    // 초기 크기 설정
    handleWindowResize()

    return (): void => {
      debouncedResize.cancel()
      window.removeEventListener("resize", debouncedResize)
    }
  }, [debounceMs])

  return windowSize
}
