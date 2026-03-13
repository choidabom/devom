import { useState, useCallback } from "react"
import { observer } from "mobx-react-lite"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { exportToJSON, exportToJSX, exportToHTML, convertToPageLayout } from "@devom/editor-core"
import { documentStore } from "../stores"
import { T } from "../theme"

export const ExportModal = observer(function ExportModal({ onClose }: { onClose: () => void }) {
  const [format, setFormat] = useState<"html" | "jsx" | "json">("html")
  const [copied, setCopied] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const data = documentStore.toSerializable()
  // Always export as page layout (flex column) regardless of canvas/page mode
  const exportElements = documentStore.canvasMode === "canvas" ? convertToPageLayout(data.elements, data.rootId) : data.elements

  const output =
    format === "html" ? exportToHTML(exportElements, data.rootId) : format === "jsx" ? exportToJSX(exportElements, data.rootId) : exportToJSON(exportElements, data.rootId)

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

      // Wait for fonts to load
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

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: T.panel,
          borderRadius: 16,
          width: 640,
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
          border: `1px solid ${T.panelBorder}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", gap: 4 }}>
            {(["html", "jsx", "json"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  padding: "6px 14px",
                  background: format === f ? T.accent : "transparent",
                  color: format === f ? "#fff" : T.text,
                  border: `1px solid ${format === f ? T.accent : T.inputBorder}`,
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 500,
                  textTransform: "uppercase",
                }}
              >
                {f}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handlePdfDownload}
              disabled={pdfLoading}
              style={{
                padding: "6px 16px",
                background: T.hover,
                color: T.text,
                border: `1px solid ${T.inputBorder}`,
                borderRadius: 6,
                cursor: pdfLoading ? "wait" : "pointer",
                fontSize: 12,
                fontWeight: 500,
                opacity: pdfLoading ? 0.6 : 1,
              }}
            >
              {pdfLoading ? "Generating..." : "PDF"}
            </button>
            <button
              onClick={handleDownload}
              style={{
                padding: "6px 16px",
                background: T.hover,
                color: T.text,
                border: `1px solid ${T.inputBorder}`,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              Download
            </button>
            <button
              onClick={handleCopy}
              style={{
                padding: "6px 16px",
                background: T.accent,
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={onClose}
              style={{
                padding: "6px 10px",
                background: T.hover,
                color: T.textSub,
                border: `1px solid ${T.inputBorder}`,
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <textarea
          value={output}
          readOnly
          style={{
            flex: 1,
            minHeight: 300,
            padding: 20,
            background: "#fafafa",
            color: T.text,
            border: "none",
            fontFamily: "'SF Mono', Menlo, monospace",
            fontSize: 12,
            resize: "none",
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
          }}
        />
      </div>
    </div>
  )
})
