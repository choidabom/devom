import { useState } from "react"
import { observer } from "mobx-react-lite"
import { exportToJSX, exportToHTML } from "@devom/editor-core"
import { documentStore } from "../stores"
import { T } from "../theme"

export const CodePreviewPanel = observer(function CodePreviewPanel() {
  const [format, setFormat] = useState<"jsx" | "html">("jsx")
  const [copied, setCopied] = useState(false)
  const data = documentStore.toSerializable()
  const output = format === "jsx" ? exportToJSX(data.elements, data.rootId) : exportToHTML(data.elements, data.rootId)

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", gap: 4, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.text, flex: 1 }}>Code</span>
        {(["jsx", "html"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            style={{
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: 500,
              background: format === f ? T.accent : "transparent",
              color: format === f ? "#fff" : T.textMuted,
              border: `1px solid ${format === f ? T.accent : T.inputBorder}`,
              borderRadius: 4,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            {f}
          </button>
        ))}
        <button
          onClick={handleCopy}
          style={{
            padding: "3px 8px",
            fontSize: 11,
            fontWeight: 500,
            background: "transparent",
            color: T.textMuted,
            border: `1px solid ${T.inputBorder}`,
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre
        style={{
          flex: 1,
          margin: 0,
          padding: 12,
          fontSize: 11,
          lineHeight: 1.5,
          fontFamily: "'SF Mono', Menlo, monospace",
          color: T.text,
          background: "#fafafa",
          overflow: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          borderBottomLeftRadius: T.panelRadius,
          borderBottomRightRadius: T.panelRadius,
        }}
      >
        {output}
      </pre>
    </>
  )
})
