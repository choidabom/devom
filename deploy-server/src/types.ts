// Extend FastifyRequest to include rawBody
declare module "fastify" {
  interface FastifyRequest {
    rawBody?: string
  }
}

// GitHub Webhook Payloads
export interface PushWebhookPayload {
  ref: string // refs/heads/feature/login
  after: string // commit SHA
  repository: {
    clone_url: string
    full_name: string
    ssh_url: string
  }
  pusher: {
    name: string
    email: string
  }
}

export interface PullRequestWebhookPayload {
  action: "opened" | "synchronize" | "closed"
  number: number
  pull_request: {
    head: {
      ref: string // 브랜치명
      sha: string
    }
  }
  repository: {
    clone_url: string
    ssh_url: string
  }
}

export type WebhookPayload = PushWebhookPayload | PullRequestWebhookPayload

// Deployment info
export interface DeploymentInfo {
  branch: string
  normalizedBranch: string // feature/login -> feature-login
  sha: string
  subdomain: string
  containerName: string
  workDir: string
}

// Build result
export interface BuildResult {
  success: boolean
  error?: string
  duration: number
  outputDir?: string
}
