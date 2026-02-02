"use client"

import "@/styles/recent-learnings.css"

interface Learning {
  date: string
  title: string
  category: string
}

export const RecentLearningsSection = () => {
  const learnings: Learning[] = [
    { date: "Jan 28", title: "How React 19 compiler optimizes components", category: "React" },
    { date: "Jan 25", title: "PostgreSQL indexing strategies for large tables", category: "Database" },
    { date: "Jan 20", title: "WebAssembly performance tricks with Rust", category: "Performance" },
    { date: "Jan 15", title: "CSS anchor positioning for tooltips", category: "CSS" },
    { date: "Jan 10", title: "Server-side rendering patterns in Next.js 15", category: "Next.js" },
  ]

  return (
    <div className="learnings-section">
      <h2 className="section-title">Recent learnings</h2>

      <div className="learnings-content">
        <div className="learnings-list">
          {learnings.map((learning, index) => (
            <div key={index} className="learning-item">
              <span className="learning-date">{learning.date}</span>
              <div className="learning-info">
                <span className="learning-title">{learning.title}</span>
                <span className="learning-category">{learning.category}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
