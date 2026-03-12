import { useState } from "react"
import { observer } from "mobx-react-lite"
import { exportToJSON, exportToJSX, exportToHTML, convertToPageLayout } from "@devom/editor-core"
import { documentStore } from "../stores"
import { T } from "../theme"

export const ExportModal = observer(function ExportModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<"html" | "jsx" | "json">("html")
  const [copied, setCopied] = useState(false)
  const data = documentStore.toSerializable()
  // Always export as page layout (flex column) regardless of canvas/page mode
  const exportElements = documentStore.canvasMode === 'canvas'
    ? convertToPageLayout(data.elements, data.rootId)
    : data.elements

  const output = format === "html"
    ? exportToHTML(exportElements, data.rootId)
    : format === "jsx"
    ? exportToJSX(exportElements, data.rootId)
    : exportToJSON(exportElements, data.rootId)

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const ext = format === "html" ? "html" : format === "jsx" ? "jsx" : "json"
    const mime = format === "json" ? "application/json" : "text/plain"
    const blob = new Blob([output], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `export.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        background: T.panel, borderRadius: 16, width: 640, maxHeight: "80vh",
        display: "flex", flexDirection: "column", boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
        border: `1px solid ${T.panelBorder}`,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["html", "jsx", "json"] as const).map(f => (
              <button key={f} onClick={() => setFormat(f)} style={{
                padding: "6px 14px", background: format === f ? T.accent : "transparent",
                color: format === f ? "#fff" : T.text, border: `1px solid ${format === f ? T.accent : T.inputBorder}`,
                borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500, textTransform: "uppercase",
              }}>{f}</button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleDownload} style={{
              padding: "6px 16px", background: T.hover, color: T.text,
              border: `1px solid ${T.inputBorder}`, borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>Download</button>
            <button onClick={handleCopy} style={{
              padding: "6px 16px", background: T.accent, color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}>{copied ? "Copied!" : "Copy"}</button>
            <button onClick={onClose} style={{
              padding: "6px 10px", background: T.hover, color: T.textSub,
              border: `1px solid ${T.inputBorder}`, borderRadius: 6, cursor: "pointer", fontSize: 14,
            }}>✕</button>
          </div>
        </div>
        <textarea value={output} readOnly style={{
          flex: 1, minHeight: 300, padding: 20, background: "#fafafa", color: T.text,
          border: "none", fontFamily: "'SF Mono', Menlo, monospace", fontSize: 12, resize: "none",
          borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        }} />
      </div>
    </div>
  )
})
