import { memo } from "react"

const PROMPT_COLOR = "#4ade80"
const TEXT_COLOR = "#e5e5e5"
const OUTPUT_COLOR = "#a3a3a3"
const LINK_COLOR = "#93c5fd"
const BG_COLOR = "#1e1e1e"

interface TerminalLine {
  cmd: string
  output: string | string[]
  links?: { label: string; url: string }[]
}

const lines: TerminalLine[] = [
  {
    cmd: "whoami",
    output: "devom",
  },
  {
    cmd: "cat about.txt",
    output: ["Developer. Mostly building for the web.", "Currently crafting a design editor and an agent."],
  },
  {
    cmd: "cat now.txt",
    output: ["Thinking about AI agents.", "Deep into chess."],
  },
  {
    cmd: "cat links.txt",
    output: [],
    links: [{ label: "GitHub", url: "https://github.com/choidabom" }],
  },
]

const cursorKeyframes = `
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
`

export const AboutMe = memo(function AboutMe() {
  return (
    <div
      style={{
        backgroundColor: BG_COLOR,
        color: TEXT_COLOR,
        fontFamily: "monospace",
        fontSize: 13,
        padding: 16,
        width: "100%",
        height: "100%",
        overflowY: "auto",
        boxSizing: "border-box",
        lineHeight: 1.6,
      }}
    >
      <style>{cursorKeyframes}</style>

      {lines.map((line, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <div>
            <span style={{ color: PROMPT_COLOR }}>$ </span>
            <span>{line.cmd}</span>
          </div>

          {typeof line.output === "string" && line.output && <div style={{ color: OUTPUT_COLOR }}>{line.output}</div>}
          {Array.isArray(line.output) &&
            line.output.map((text, j) => (
              <div key={j} style={{ color: OUTPUT_COLOR }}>
                {text}
              </div>
            ))}

          {line.links?.map((link, j) => (
            <div key={j}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: LINK_COLOR,
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                {link.label}
              </a>
            </div>
          ))}
        </div>
      ))}

      <div>
        <span style={{ color: PROMPT_COLOR }}>$ </span>
        <span
          style={{
            animation: "blink 1s step-end infinite",
          }}
        >
          █
        </span>
      </div>
    </div>
  )
})
