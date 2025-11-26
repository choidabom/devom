const fs = require("fs")
const path = require("path")

const calendarDir = path.join(__dirname, "../public/calendar")
const outputPath = path.join(__dirname, "../src/data/calendar-manifest.json")

try {
  const files = fs.readdirSync(calendarDir)

  const manifest = {}
  files.forEach((file) => {
    if (/\.(jpeg|jpg|png|webp|gif)$/i.test(file)) {
      const key = `/calendar/${file}`
      manifest[key] = `/calendar/${file}`
    }
  })

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2))
  console.log(`✓ Generated calendar manifest with ${Object.keys(manifest).length} images`)
} catch (error) {
  console.error("Error generating calendar manifest:", error)
  process.exit(1)
}
