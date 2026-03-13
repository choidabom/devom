/**
 * Combines editor-shell and editor-canvas build outputs into a single deployable directory.
 *
 * Output structure:
 *   dist-editor/
 *   ├── index.html          (Shell)
 *   ├── assets/             (Shell assets)
 *   └── canvas/
 *       ├── index.html      (Canvas)
 *       └── assets/         (Canvas assets)
 */
import { cpSync, rmSync, mkdirSync, existsSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const output = resolve(root, "dist-editor")
const shellDist = resolve(root, "apps/editor-shell/dist")
const canvasDist = resolve(root, "apps/editor-canvas/dist")

// Validate builds exist
if (!existsSync(shellDist)) {
  console.error("Shell build not found. Run pnpm editor:build first.")
  process.exit(1)
}
if (!existsSync(canvasDist)) {
  console.error("Canvas build not found. Run pnpm editor:build first.")
  process.exit(1)
}

// Preserve .vercel link across rebuilds
const vercelDir = resolve(output, ".vercel")
const hadVercel = existsSync(vercelDir)
const tempVercel = resolve(root, ".vercel-link-backup")
if (hadVercel) cpSync(vercelDir, tempVercel, { recursive: true })

// Clean and create output
if (existsSync(output)) rmSync(output, { recursive: true })
mkdirSync(output, { recursive: true })

// Copy Shell → root
cpSync(shellDist, output, { recursive: true })

// Copy Canvas → /canvas/
cpSync(canvasDist, resolve(output, "canvas"), { recursive: true })

// Write vercel.json — disable SPA rewrites, clean URLs off
import { writeFileSync } from "fs"
writeFileSync(
  resolve(output, "vercel.json"),
  JSON.stringify(
    {
      cleanUrls: false,
      trailingSlash: true,
      headers: [{ source: "/canvas/(.*)", headers: [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] }],
    },
    null,
    2
  )
)

// Restore .vercel link
if (hadVercel) {
  cpSync(tempVercel, vercelDir, { recursive: true })
  rmSync(tempVercel, { recursive: true })
}

console.log("Combined editor build → dist-editor/")
console.log("  / → Shell")
console.log("  /canvas/ → Canvas")
