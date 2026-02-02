"use client"

import "@/styles/skills.css"

interface SkillCategory {
  category: string
  skills: string[]
}

export const SkillsSection = () => {
  const skillCategories: SkillCategory[] = [
    {
      category: "Frontend",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Framer Motion", "Vue.js"],
    },
    {
      category: "Backend",
      skills: ["Node.js", "Express", "Python", "Django", "PostgreSQL", "MongoDB"],
    },
    {
      category: "Tools & Others",
      skills: ["Git", "Docker", "AWS", "Figma", "Vite", "Webpack"],
    },
  ]

  return (
    <div className="skills-section">
      <h2 className="section-title">Skills & Technologies</h2>
      <div className="skills-categories">
        {skillCategories.map((category, index) => (
          <div key={index} className="skills-category">
            <h3 className="skills-category-title">{category.category}</h3>
            <div className="skills-grid">
              {category.skills.map((skill, skillIndex) => (
                <div key={skillIndex} className="skill-badge">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
