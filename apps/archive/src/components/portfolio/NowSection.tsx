"use client"

import "@/styles/now-section.css"

interface NowItem {
  emoji: string
  text: string
}

export const NowSection = () => {
  const currentFocus: NowItem[] = [
    { emoji: "💻", text: "Building a new feature with React Server Components" },
    { emoji: "📚", text: "Learning Rust and WebAssembly" },
    { emoji: "📖", text: "Reading 'Designing Data-Intensive Applications'" },
  ]

  const metadata = {
    location: "Seoul, South Korea",
    lastUpdated: "January 2026",
  }

  return (
    <div className="now-section">
      <h2 className="section-title">What I'm doing now</h2>

      <div className="now-content">
        <div className="now-list">
          {currentFocus.map((item, index) => (
            <div key={index} className="now-item">
              <span className="now-emoji">{item.emoji}</span>
              <span className="now-text">{item.text}</span>
            </div>
          ))}
        </div>

        <div className="now-metadata">
          <div className="now-meta-item">
            <span className="now-meta-label">Location</span>
            <span className="now-meta-value">{metadata.location}</span>
          </div>
          <div className="now-meta-item">
            <span className="now-meta-label">Updated</span>
            <span className="now-meta-value">{metadata.lastUpdated}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
