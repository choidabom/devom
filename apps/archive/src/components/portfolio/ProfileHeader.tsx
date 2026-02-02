"use client"

import { ActivityHeatmap } from "./ActivityHeatmap"
import "@/styles/profile-header.css"

export const ProfileHeader = () => {
  const socials = [
    { name: "GitHub", url: "https://github.com", icon: "💻" },
    { name: "Twitter", url: "https://twitter.com", icon: "🐦" },
    { name: "LinkedIn", url: "https://linkedin.com", icon: "💼" },
    { name: "Email", url: "mailto:hello@example.com", icon: "📧" },
  ]

  return (
    <div className="profile-header">
      <div className="profile-info">
        <div className="profile-details">
          <h1 className="profile-name">Your Name</h1>
          <p className="profile-title">Full Stack Developer</p>
          <div className="profile-socials-inline">
            {socials.map((social) => (
              <a key={social.name} href={social.url} className="social-link-inline" target="_blank" rel="noopener noreferrer" title={social.name}>
                <span className="social-icon">{social.icon}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <ActivityHeatmap compact />
    </div>
  )
}
