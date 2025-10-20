import { useEffect, useState } from "react"

export const useWindowSize = (): { width: number; height: number } => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  })

  useEffect(() => {
    const handleWindowResize = (): void => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    // resize event: only occurs on the window object and fires continuously when the browser window is resized
    window.addEventListener("resize", handleWindowResize)

    return (): void => {
      window.removeEventListener("resize", handleWindowResize)
    }
  }, [])

  return windowSize
}
