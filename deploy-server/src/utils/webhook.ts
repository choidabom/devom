import crypto from "node:crypto"
import type { FastifyRequest } from "fastify"
import { config } from "../config.js"
import { logger } from "./logger.js"
import type { PullRequestWebhookPayload, PushWebhookPayload } from "../types.js"

/**
 * Verify GitHub webhook HMAC signature
 */
export function verifyWebhookSignature(request: FastifyRequest): boolean {
  const signature = request.headers["x-hub-signature-256"] as string | undefined
  const payload = request.rawBody || JSON.stringify(request.body)

  if (!signature) {
    logger.warn("Missing X-Hub-Signature-256 header")
    return false
  }

  const expectedSignature =
    "sha256=" + crypto.createHmac("sha256", config.githubWebhookSecret).update(payload).digest("hex")

  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))

  if (!isValid) {
    logger.warn("Invalid webhook signature")
  }

  return isValid
}

/**
 * Parse branch name from ref
 * refs/heads/feature/login -> feature/login
 */
export function parseBranchName(ref: string): string {
  return ref.replace("refs/heads/", "")
}

/**
 * Normalize branch name for subdomain
 * feature/login -> feature-login
 * feature_test -> feature-test
 */
export function normalizeBranchName(branch: string): string {
  return branch.replace(/[\/\_]/g, "-").toLowerCase()
}

/**
 * Check if branch is allowed by regex filter
 */
export function isBranchAllowed(branch: string): boolean {
  const isAllowed = config.allowedBranchRegex.test(branch)

  if (!isAllowed) {
    logger.info(`Branch ${branch} filtered out by ALLOWED_BRANCH_REGEX`)
  }

  return isAllowed
}

/**
 * Extract deployment info from push webhook
 */
export function extractPushInfo(payload: PushWebhookPayload) {
  const branch = parseBranchName(payload.ref)
  const normalizedBranch = normalizeBranchName(branch)
  const sha = payload.after
  const subdomain =
    branch === config.defaultBranch ? config.baseDomain : `${normalizedBranch}.${config.baseDomain}`
  const containerName = branch === config.defaultBranch ? "production" : `preview-${normalizedBranch}`
  const workDir = `${config.workDir}/${normalizedBranch}`

  return {
    branch,
    normalizedBranch,
    sha,
    subdomain,
    containerName,
    workDir,
  }
}

/**
 * Extract deployment info from PR webhook
 */
export function extractPRInfo(payload: PullRequestWebhookPayload) {
  const branch = payload.pull_request.head.ref
  const normalizedBranch = normalizeBranchName(branch)
  const sha = payload.pull_request.head.sha
  const prNumber = payload.number
  const subdomain = `pr-${prNumber}.${config.baseDomain}`
  const containerName = `preview-pr-${prNumber}`
  const workDir = `${config.workDir}/pr-${prNumber}`

  return {
    branch,
    normalizedBranch,
    sha,
    subdomain,
    containerName,
    workDir,
    prNumber,
  }
}
