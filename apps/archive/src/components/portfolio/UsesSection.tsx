"use client"

import "@/styles/uses-section.css"

interface UseCategory {
  category: string
  items: string[]
}

export const UsesSection = () => {
  const uses: UseCategory[] = [
    {
      category: "Development",
      items: ["VSCode", "iTerm2", "Docker", "Postman"],
    },
    {
      category: "Design",
      items: ["Figma", "Excalidraw", "Arc Browser"],
    },
    {
      category: "Hardware",
      items: ["MacBook Pro M3", "Magic Keyboard", "AirPods Pro"],
    },
  ]

  return (
    <div className="uses-section">
      <h2 className="section-title">What I use</h2>

      <div className="uses-grid">
        {uses.map((category, index) => (
          <div key={index} className="uses-category">
            <h3 className="uses-category-title">{category.category}</h3>
            <div className="uses-items">
              {category.items.map((item, idx) => (
                <span key={idx} className="uses-item">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
