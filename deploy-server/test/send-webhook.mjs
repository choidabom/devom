#!/usr/bin/env node

import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Configuration
const SERVER_URL = process.env.SERVER_URL || "http://localhost:3000"
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET || "your-webhook-secret-here"

/**
 * Generate HMAC SHA256 signature
 */
function generateSignature(payload, secret) {
  const hmac = crypto.createHmac("sha256", secret)
  hmac.update(payload)
  return `sha256=${hmac.digest("hex")}`
}

/**
 * Send webhook to server
 */
async function sendWebhook(eventType, fixtureFile) {
  const fixturePath = path.join(__dirname, "fixtures", fixtureFile)
  const payload = fs.readFileSync(fixturePath, "utf-8")
  const signature = generateSignature(payload, WEBHOOK_SECRET)

  console.log(`📤 Sending ${eventType} webhook...`)
  console.log(`   Payload: ${fixtureFile}`)
  console.log(`   Signature: ${signature}`)

  try {
    const response = await fetch(`${SERVER_URL}/webhook`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Hub-Signature-256": signature,
        "X-GitHub-Event": eventType,
        "X-GitHub-Delivery": crypto.randomUUID(),
      },
      body: payload,
    })

    const result = await response.text()
    console.log(`✅ Response (${response.status}):`, result)
  } catch (error) {
    console.error(`❌ Error:`, error.message)
  }
}

// CLI
const command = process.argv[2]

if (!command) {
  console.log(`
Usage: node send-webhook.mjs <command>

Commands:
  push           Send push event
  pr-open        Send PR opened event
  pr-close       Send PR closed event
  health         Check server health

Environment variables:
  SERVER_URL              Server URL (default: http://localhost:3000)
  GITHUB_WEBHOOK_SECRET   Webhook secret (default: your-webhook-secret-here)
`)
  process.exit(1)
}

switch (command) {
  case "push":
    await sendWebhook("push", "push-event.json")
    break

  case "pr-open":
    await sendWebhook("pull_request", "pr-opened-event.json")
    break

  case "pr-close":
    await sendWebhook("pull_request", "pr-closed-event.json")
    break

  case "health":
    try {
      const response = await fetch(`${SERVER_URL}/health`)
      const result = await response.json()
      console.log("✅ Health check:", result)
    } catch (error) {
      console.error("❌ Health check failed:", error.message)
    }
    break

  default:
    console.error(`Unknown command: ${command}`)
    process.exit(1)
}
