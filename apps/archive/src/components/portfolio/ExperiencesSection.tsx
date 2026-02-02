"use client"

import "@/styles/experiences.css"

interface Experience {
  company: string
  role: string
  period: string
  description: string
  tags?: string[]
}

export const ExperiencesSection = () => {
  const experiences: Experience[] = [
    {
      company: "Example Tech Co.",
      role: "Senior Full Stack Developer",
      period: "2023 - Present",
      description: "Leading development of microservices architecture. Built scalable APIs serving 1M+ users. Mentored junior developers and established code review processes.",
      tags: ["React", "Node.js", "AWS", "TypeScript"],
    },
    {
      company: "Startup Inc.",
      role: "Full Stack Developer",
      period: "2021 - 2023",
      description: "Developed and launched multiple features for SaaS platform. Improved application performance by 40%. Collaborated with design team on UX improvements.",
      tags: ["Vue.js", "Python", "PostgreSQL"],
    },
    {
      company: "Design Agency",
      role: "Frontend Developer",
      period: "2020 - 2021",
      description: "Created responsive websites and interactive experiences for clients. Implemented pixel-perfect designs. Optimized web performance and accessibility.",
      tags: ["HTML", "CSS", "JavaScript", "Figma"],
    },
  ]

  return (
    <div className="experiences-section">
      <h2 className="section-title">Experiences</h2>
      <div className="experiences-list">
        {experiences.map((exp, index) => (
          <div key={index} className="experience-card">
            <div className="experience-header">
              <div className="experience-main">
                <h3 className="experience-company">{exp.company}</h3>
                <p className="experience-role">{exp.role}</p>
              </div>
              <span className="experience-period">{exp.period}</span>
            </div>
            <p className="experience-description">{exp.description}</p>
            {exp.tags && (
              <div className="experience-tags">
                {exp.tags.map((tag, tagIndex) => (
                  <span key={tagIndex} className="experience-tag">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
