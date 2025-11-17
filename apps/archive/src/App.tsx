import type { JSX } from "react"
import { useEffect, useState } from "react"
import { Portfolio } from "./components/portfolio/Portfolio"

const AppContent = (): JSX.Element => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener("popstate", handlePopState)
    handlePopState() // Initial check

    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  // Navigate function for internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const anchor = target.closest("a")

      if (anchor && anchor.href.startsWith(window.location.origin)) {
        e.preventDefault()
        const path = anchor.pathname

        window.history.pushState({}, "", path)
        setCurrentPath(path)
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  // Portfolio
  return (
    <>
      <Portfolio />
      {/* {isGuestbookOpen && (
        <>
          <div className="guestbook-backdrop" onClick={closeGuestbook} />
          <div className="guestbook-floating-window">
            <Guestbook isFloating onClose={closeGuestbook} />
          </div>
        </>
      )} */}
    </>
  )
}

const App = (): JSX.Element => {
  return <AppContent />
}

export default App
