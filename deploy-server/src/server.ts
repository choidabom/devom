import cors from "@fastify/cors"
import Fastify from "fastify"
import PQueue from "p-queue"
import { config, validateConfig } from "./config.js"
import { logger } from "./utils/logger.js"
import {
  verifyWebhookSignature,
  isBranchAllowed,
  extractPushInfo,
  extractPRInfo,
} from "./utils/webhook.js"
import { cloneRepository, buildProject } from "./utils/git.js"
import { buildDockerImage, runContainer, cleanupContainer, ensureDockerNetwork } from "./utils/docker.js"
import type { PushWebhookPayload, PullRequestWebhookPayload } from "./types.js"

const server = Fastify({ logger: false })

// Build queue to limit concurrent builds
const buildQueue = new PQueue({ concurrency: config.maxConcurrentBuilds })

server.register(cors)

// Add raw body parser for webhook signature verification
server.addContentTypeParser(
  "application/json",
  { parseAs: "buffer" },
  function (req, body, done) {
    try {
      // Store raw body for signature verification
      req.rawBody = body.toString("utf-8")
      const json = JSON.parse(req.rawBody)
      done(null, json)
    } catch (err: any) {
      err.statusCode = 400
      done(err, undefined)
    }
  },
)

server.get("/", async () => ({ message: "Deploy Server is running! 🚀" }))

// Health check endpoint
server.get("/health", async () => ({
  status: "ok",
  queueSize: buildQueue.size,
  pending: buildQueue.pending,
}))

/**
 * Handle Push webhook
 */
async function handlePushEvent(payload: PushWebhookPayload) {
  const deployInfo = extractPushInfo(payload)

  logger.info(`Push event received for branch: ${deployInfo.branch}`)

  // Check if branch is allowed
  if (!isBranchAllowed(deployInfo.branch)) {
    logger.info(`Branch ${deployInfo.branch} is not allowed, skipping deployment`)
    return
  }

  // Add to build queue
  await buildQueue.add(async () => {
    try {
      logger.info(`[${deployInfo.containerName}] Starting deployment`)

      // 1. Clone repository
      await cloneRepository(deployInfo)

      // 2. Build project
      const buildResult = await buildProject(deployInfo)

      if (!buildResult.success) {
        throw new Error(`Build failed: ${buildResult.error}`)
      }

      // 3. Build Docker image
      await buildDockerImage(deployInfo, buildResult.outputDir!)

      // 4. Run container
      await runContainer(deployInfo, buildResult.outputDir!)

      logger.info(`[${deployInfo.containerName}] Deployment completed successfully`)
      logger.info(`[${deployInfo.containerName}] URL: http://${deployInfo.subdomain}`)
    } catch (error) {
      logger.error(`[${deployInfo.containerName}] Deployment failed:`, error)
      throw error
    }
  })
}

/**
 * Handle Pull Request webhook
 */
async function handlePullRequestEvent(payload: PullRequestWebhookPayload) {
  const { action } = payload

  logger.info(`Pull request event received: ${action}`)

  if (action === "closed") {
    // Clean up preview environment
    const prInfo = extractPRInfo(payload)
    logger.info(`Cleaning up PR preview: ${prInfo.containerName}`)

    try {
      await cleanupContainer(prInfo.containerName)
      logger.info(`PR preview cleaned up: ${prInfo.containerName}`)
    } catch (error) {
      logger.error(`Failed to cleanup PR preview: ${prInfo.containerName}`, error)
    }

    return
  }

  if (action === "opened" || action === "synchronize") {
    // Deploy preview environment
    const prInfo = extractPRInfo(payload)

    // Add to build queue
    await buildQueue.add(async () => {
      try {
        logger.info(`[${prInfo.containerName}] Starting PR preview deployment`)

        // 1. Clone repository
        await cloneRepository(prInfo)

        // 2. Build project
        const buildResult = await buildProject(prInfo)

        if (!buildResult.success) {
          throw new Error(`Build failed: ${buildResult.error}`)
        }

        // 3. Build Docker image
        await buildDockerImage(prInfo, buildResult.outputDir!)

        // 4. Run container
        await runContainer(prInfo, buildResult.outputDir!)

        logger.info(`[${prInfo.containerName}] PR preview deployed successfully`)
        logger.info(`[${prInfo.containerName}] URL: http://${prInfo.subdomain}`)
      } catch (error) {
        logger.error(`[${prInfo.containerName}] PR preview deployment failed:`, error)
        throw error
      }
    })
  }
}

// GitHub Webhook endpoint
server.post("/webhook", async (request, reply) => {
  const deliveryId = request.headers["x-github-delivery"] as string
  const eventType = request.headers["x-github-event"] as string

  logger.info(`Webhook received: ${eventType} (delivery: ${deliveryId})`)

  // Verify webhook signature
  if (!verifyWebhookSignature(request)) {
    logger.warn("Invalid webhook signature, rejecting request")
    return reply.code(401).send({ error: "Invalid signature" })
  }

  try {
    // Handle different event types
    if (eventType === "push") {
      await handlePushEvent(request.body as PushWebhookPayload)
    } else if (eventType === "pull_request") {
      await handlePullRequestEvent(request.body as PullRequestWebhookPayload)
    } else {
      logger.info(`Unsupported event type: ${eventType}`)
    }

    return reply.send({ status: "received" })
  } catch (error) {
    logger.error("Error handling webhook:", error)
    return reply.code(500).send({ error: "Internal server error" })
  }
})

// Start server
const start = async () => {
  try {
    // Validate configuration
    validateConfig()
    logger.info("Configuration validated successfully")

    // Ensure Docker network exists
    await ensureDockerNetwork()

    // Start Fastify server
    await server.listen({ port: config.port, host: "0.0.0.0" })
    logger.info(`🚀 Deploy Server running at http://localhost:${config.port}`)
    logger.info(`📦 Build queue concurrency: ${config.maxConcurrentBuilds}`)
    logger.info(`🌐 Base domain: ${config.baseDomain}`)
  } catch (err) {
    logger.error("Failed to start server:", err)
    process.exit(1)
  }
}

start()
