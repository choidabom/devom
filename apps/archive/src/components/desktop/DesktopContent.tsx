import { type JSX, useEffect, useRef } from "react"
import { useApplications } from "../../context/useApplications"
import { useDesktopMode } from "../../hooks/useDesktopMode"
import Blog from "../application/Blog"
import Docs from "../application/Docs"
import AppWindow from "../appWindow/AppWindow"

export const DesktopContent = (): JSX.Element => {
  const initializedRef = useRef<boolean>(false)
  const { desktopMode, toggleDesktopMode } = useDesktopMode()
  const { applications, addApplication, setZIndexToFront } = useApplications()

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true

      addApplication("blog", <Blog />, {
        width: 800,
        height: 650,
        left: 70,
        top: 70,
        minWidth: 640,
        minHeight: 640,
      })
      addApplication("docs", <Docs />, {
        width: 500,
        height: 750,
        left: 750,
        top: 30,
      })
    }
  }, [addApplication])

  return (
    <div className="h-screen w-screen bg-light bg-cover dark:bg-dark transition-all duration-500 ease-in-out">
      <button
        type="button"
        className="absolute right-5 top-5 rounded-full bg-gray-100 p-2 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-500"
        aria-label={`Switch to ${desktopMode === "light" ? "dark" : "light"} mode`}
        onClick={toggleDesktopMode}
      >
        <span className="transition-opacity duration-300 opacity-100">{desktopMode === "light" ? "🌞" : "🌙"}</span>
      </button>

      {applications.map((app) => (
        <AppWindow key={app.id} app={app} onZIndex={() => setZIndexToFront(app.id)} />
      ))}
    </div>
  )
}
