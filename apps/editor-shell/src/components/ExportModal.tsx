import { useState, useCallback, useMemo, useRef } from "react"
import { observer } from "mobx-react-lite"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { exportToJSON, exportToJSX, exportToHTML, convertToPageLayout } from "@devom/editor-core"
import { documentStore } from "../stores"
import { T } from "../theme"

export const ExportPanel = observer(function ExportPanel({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<"html" | "jsx" | "json">("html")
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [panelWidth, setPanelWidth] = useState(480)
  const isResizingRef = useRef(false)
  const data = documentStore.toSerializable()
  const exportElements = documentStore.canvasMode === "canvas" ? convertToPageLayout(data.elements, data.rootId) : data.elements

  const output = useMemo(() => {
    if (format === "html") return exportToHTML(exportElements, data.rootId)
    if (format === "json") return exportToJSON(exportElements, data.rootId)
    return exportToJSX(exportElements, data.rootId)
  }, [format, exportElements, data.rootId])

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const ext = format === "html" ? "html" : format === "jsx" ? "tsx" : "json"
    const mime = format === "json" ? "application/json" : "text/plain"
    const blob = new Blob([output], { type: `${mime};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `export.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePdfDownload = useCallback(async () => {
    setPdfLoading(true)
    let iframe: HTMLIFrameElement | null = null
    try {
      const htmlContent = exportToHTML(exportElements, data.rootId)
      iframe = document.createElement("iframe")
      iframe.style.cssText = "position:fixed;left:-9999px;top:0;width:1280px;height:900px;border:none;"
      document.body.appendChild(iframe)
      const iframeDoc = iframe.contentDocument!
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      if (iframeDoc.fonts) await iframeDoc.fonts.ready
      else await new Promise((r) => setTimeout(r, 500))

      const root = (iframeDoc.body.firstElementChild as HTMLElement) ?? iframeDoc.body
      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        width: root.scrollWidth,
        height: root.scrollHeight,
      })

      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const isLandscape = imgWidth > imgHeight
      const pdfW = isLandscape ? 841.89 : 595.28
      const pdfH = (imgHeight * pdfW) / imgWidth
      const pdf = new jsPDF({ orientation: isLandscape ? "l" : "p", unit: "pt", format: [pdfW, pdfH] })
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfW, pdfH)
      pdf.save("export.pdf")
    } catch (err) {
      console.error("PDF export failed:", err)
      alert("PDF export failed. Check console for details.")
    } finally {
      if (iframe?.parentNode) document.body.removeChild(iframe)
      setPdfLoading(false)
    }
  }, [exportElements, data.rootId])

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.setPointerCapture(e.pointerId)
    isResizingRef.current = true
    const startX = e.clientX
    const startW = panelWidth
    const line = target.firstElementChild as HTMLElement
    if (line) line.style.background = T.accent

    const onMove = (ev: PointerEvent) => {
      setPanelWidth(Math.max(320, Math.min(900, startW - (ev.clientX - startX))))
    }
    const onUp = () => {
      if (line) line.style.background = ""
      isResizingRef.current = false
      target.removeEventListener("pointermove", onMove)
      target.removeEventListener("pointerup", onUp)
    }
    target.addEventListener("pointermove", onMove)
    target.addEventListener("pointerup", onUp)
  }

  return (
    <div
      style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: panelWidth,
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        padding: "0 8px 8px 0",
      }}
    >
      {/* Resize handle */}
      <div
        style={{
          position: "absolute",
          left: -4,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: "col-resize",
          zIndex: 21,
          touchAction: "none",
        }}
        onPointerDown={handleResizePointerDown}
        onPointerEnter={(e) => {
          if (!isResizingRef.current) {
            const line = e.currentTarget.firstElementChild as HTMLElement
            if (line) line.style.background = T.border
          }
        }}
        onPointerLeave={(e) => {
          if (!isResizingRef.current) {
            const line = e.currentTarget.firstElementChild as HTMLElement
            if (line) line.style.background = ""
          }
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 3,
            top: 0,
            bottom: 0,
            width: 1,
            transition: "background 0.15s ease",
          }}
        />
      </div>

      {/* Panel content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: T.panel,
          borderRadius: T.panelRadius,
          boxShadow: T.panelShadow,
          border: `1px solid ${T.panelBorder}`,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 3 }}>
            {(["html", "jsx", "json"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  padding: "4px 10px",
                  background: format === f ? T.accent : "transparent",
                  color: format === f ? "#fff" : T.text,
                  border: `1px solid ${format === f ? T.accent : T.inputBorder}`,
                  borderRadius: 5,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "2px 6px",
              background: "transparent",
              color: T.textSub,
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            ✕
          </button>
        </div>

        {/* Code area */}
        <textarea
          value={output}
          readOnly
          style={{
            flex: 1,
            padding: 16,
            background: "#fafafa",
            color: T.text,
            border: "none",
            fontFamily: "'SF Mono', Menlo, monospace",
            fontSize: 11,
            lineHeight: 1.6,
            resize: "none",
            outline: "none",
          }}
        />

        {/* Footer actions */}
        <div style={{ display: "flex", gap: 6, padding: "8px 12px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
          <button
            onClick={handleCopy}
            style={{
              flex: 1,
              padding: "6px 0",
              background: T.accent,
              color: "#fff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            style={{
              padding: "6px 12px",
              background: T.hover,
              color: T.text,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            Download
          </button>
          <button
            onClick={handlePdfDownload}
            disabled={pdfLoading}
            style={{
              padding: "6px 12px",
              background: T.hover,
              color: T.text,
              border: `1px solid ${T.inputBorder}`,
              borderRadius: 6,
              cursor: pdfLoading ? "wait" : "pointer",
              fontSize: 11,
              fontWeight: 500,
              opacity: pdfLoading ? 0.6 : 1,
            }}
          >
            {pdfLoading ? "..." : "PDF"}
          </button>
        </div>
      </div>
    </div>
  )
})
