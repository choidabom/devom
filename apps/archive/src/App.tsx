import type { JSX } from "react"
import { useEffect, useState } from "react"
import { BlogList } from "./components/blog/BlogList"
import { BlogPost } from "./components/blog/BlogPost"
import { Portfolio } from "./components/portfolio/Portfolio"

const App = (): JSX.Element => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [postId, setPostId] = useState<string | null>(null)

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname)

      // Check if we're on a blog post page
      const blogPostMatch = window.location.pathname.match(/^\/blog\/(.+)$/)
      if (blogPostMatch) {
        setPostId(blogPostMatch[1])
      } else {
        setPostId(null)
      }
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

        // Check if we're navigating to a blog post
        const blogPostMatch = path.match(/^\/blog\/(.+)$/)
        if (blogPostMatch) {
          setPostId(blogPostMatch[1])
        } else {
          setPostId(null)
        }
      }
    }

    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [])

  // Blog pages
  if (currentPath.startsWith("/blog/") && postId) {
    return <BlogPost postId={postId} />
  }

  if (currentPath === "/blog") {
    return <BlogList />
  }

  // Portfolio
  return <Portfolio />
}

export default App
