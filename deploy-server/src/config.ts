import dotenv from "dotenv"

dotenv.config()

export const config = {
  // GitHub
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || "",
  githubToken: process.env.GITHUB_TOKEN || "",

  // Repository
  repoSshUrl: process.env.REPO_SSH_URL || "",

  // Paths
  workDir: process.env.WORK_DIR || "/tmp/deploy/workspace",
  cacheDir: process.env.CACHE_DIR || "/tmp/deploy/cache",
  logDir: process.env.LOG_DIR || "/tmp/deploy/logs",

  // Domain
  baseDomain: process.env.BASE_DOMAIN || "localhost",
  defaultBranch: process.env.DEFAULT_BRANCH || "master",

  // Filtering
  allowedBranchRegex: new RegExp(
    process.env.ALLOWED_BRANCH_REGEX || "^(feature|fix|hotfix|master|main).*$",
  ),

  // Build
  buildFilter: process.env.BUILD_FILTER || "@devom/archive",

  // Server
  port: parseInt(process.env.PORT || "3000", 10),
  buildTimeout: parseInt(process.env.BUILD_TIMEOUT || "600000", 10),
  maxConcurrentBuilds: parseInt(process.env.MAX_CONCURRENT_BUILDS || "3", 10),

  // Docker
  registry: process.env.REGISTRY || "",
  dockerNetworkName: process.env.DOCKER_NETWORK_NAME || "deploy-network",

  // Notifications
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || "",
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || "",
} as const

// Validate required config
export function validateConfig() {
  const errors: string[] = []

  if (!config.githubWebhookSecret) {
    errors.push("GITHUB_WEBHOOK_SECRET is required")
  }

  if (!config.repoSshUrl) {
    errors.push("REPO_SSH_URL is required")
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join("\n")}`)
  }
}
