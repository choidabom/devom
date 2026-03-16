import { useState, useMemo } from "react"
import { observer } from "mobx-react-lite"
import { Highlight, themes } from "prism-react-renderer"
import { exportToJSX, exportToHTML, convertToPageLayout } from "@devom/editor-core"
import { documentStore } from "../stores"
import { T } from "../theme"

const FORMAT_LANGUAGE = { html: "html", jsx: "tsx" } as const

export const CodePreviewPanel = observer(function CodePreviewPanel() {
  const [format, setFormat] = useState<"jsx" | "html">("jsx")
  const [copied, setCopied] = useState(false)
  const data = documentStore.toSerializable()
  const exportElements = documentStore.canvasMode === "canvas" ? convertToPageLayout(data.elements, data.rootId) : data.elements

  const output = useMemo(() => {
    return format === "jsx" ? exportToJSX(exportElements, data.rootId) : exportToHTML(exportElements, data.rootId)
  }, [format, exportElements, data.rootId])

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
      <div style={{ flex: 1, overflow: "auto" }}>
        <Highlight theme={themes.oneLight} code={output} language={FORMAT_LANGUAGE[format]}>
          {({ tokens, getLineProps, getTokenProps }) => (
            <pre
              style={{
                margin: 0,
                padding: 12,
                fontSize: 11,
                lineHeight: 1.5,
                fontFamily: "'SF Mono', Menlo, monospace",
                background: "#fafafa",
                minHeight: "100%",
                borderBottomLeftRadius: T.panelRadius,
                borderBottomRightRadius: T.panelRadius,
              }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  <span style={{ display: "inline-block", width: 24, color: "#ccc", fontSize: 10, textAlign: "right", paddingRight: 8, userSelect: "none" }}>{i + 1}</span>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
    </>
  )
})
