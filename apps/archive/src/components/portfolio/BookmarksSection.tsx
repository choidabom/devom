"use client"

import "@/styles/bookmarks-section.css"

interface Bookmark {
  type: "Article" | "Tool" | "Repo" | "Video"
  title: string
  url: string
}

export const BookmarksSection = () => {
  const bookmarks: Bookmark[] = [
    { type: "Article", title: "Making the world's fastest website", url: "#" },
    { type: "Tool", title: "tldraw - Infinite canvas whiteboard", url: "#" },
    { type: "Repo", title: "shadcn/ui - Re-usable components", url: "#" },
    { type: "Video", title: "Advanced React Patterns", url: "#" },
    { type: "Article", title: "How to build a design system", url: "#" },
  ]

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Article":
        return "#3b82f6"
      case "Tool":
        return "#8b5cf6"
      case "Repo":
        return "#10b981"
      case "Video":
        return "#f59e0b"
      default:
        return "#6b7280"
    }
  }

  return (
    <div className="bookmarks-section">
      <h2 className="section-title">Worth sharing</h2>

      <div className="bookmarks-content">
        <div className="bookmarks-list">
          {bookmarks.map((bookmark, index) => (
            <a key={index} href={bookmark.url} className="bookmark-item" target="_blank" rel="noopener noreferrer">
              <span className="bookmark-type" style={{ color: getTypeColor(bookmark.type) }}>
                [{bookmark.type}]
              </span>
              <span className="bookmark-title">{bookmark.title}</span>
              <span className="bookmark-arrow">→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
