"use client"

import "@/styles/footer.css"

export const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="portfolio-footer">
      <div className="footer-content">
        <p className="footer-text">© {currentYear} Your Name. Built with Next.js & TypeScript.</p>
        <div className="footer-links">
          <a href="#" className="footer-link">
            Privacy
          </a>
          <span className="footer-separator">·</span>
          <a href="#" className="footer-link">
            Terms
          </a>
          <span className="footer-separator">·</span>
          <a href="#" className="footer-link">
            RSS
          </a>
        </div>
      </div>
      <p className="footer-badge">
        Generated with{" "}
        <a href="https://claude.com/claude-code" target="_blank" rel="noopener noreferrer" className="footer-badge-link">
          Claude Code
        </a>
      </p>
    </footer>
  )
}
