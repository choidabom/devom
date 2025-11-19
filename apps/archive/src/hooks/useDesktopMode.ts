import { safeLocalStorage } from "@devom/utils"
import { useEffect, useState } from "react"

type DesktopMode = "light" | "dark"

export const useDesktopMode = (): {
  desktopMode: DesktopMode
  toggleDesktopMode: () => void
} => {
  const [desktopMode, setDesktopMode] = useState<DesktopMode>(() => {
    const savedTheme = safeLocalStorage.getItem("theme") as DesktopMode | null
    return savedTheme || "light"
  })

  const toggleDesktopMode = (): void => {
    setDesktopMode((currentMode) => {
      const newMode: DesktopMode = currentMode === "light" ? "dark" : "light"
      safeLocalStorage.setItem("theme", newMode)
      document.documentElement.classList.replace(currentMode, newMode)

      return newMode
    })
  }

  useEffect(() => {
    // Apply initial theme class to documentElement
    document.documentElement.classList.add(desktopMode)

    return (): void => {
      document.documentElement.classList.remove("light", "dark")
    }
  }, [desktopMode])

  return { desktopMode, toggleDesktopMode }
}
