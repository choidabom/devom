import Dockerode from "dockerode"
import { config } from "../config.js"
import { logger } from "./logger.js"
import type { DeploymentInfo } from "../types.js"
import fs from "node:fs/promises"
import path from "node:path"

const docker = new Dockerode()

/**
 * Create Dockerfile for static site or Next.js standalone
 */
async function createDockerfile(workDir: string, outputDir: string): Promise<void> {
  // Check if this is a Next.js standalone build
  const isNextStandalone = outputDir.includes(".next/standalone")

  let dockerfile: string

  if (isNextStandalone) {
    // Next.js standalone Dockerfile
    // Extract app directory (e.g., "apps/archive" from "apps/archive/.next/standalone")
    const appDir = outputDir.replace("/.next/standalone", "")

    dockerfile = `FROM node:20-alpine

WORKDIR /app

# Copy standalone server
COPY ${outputDir} ./

# Copy static files
COPY ${appDir}/.next/static ./.next/static

# Copy public files if they exist
COPY ${appDir}/public ./public 2>/dev/null || true

ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "${appDir}/server.js"]
`
  } else {
    // Static site with nginx
    dockerfile = `FROM nginx:alpine

# Copy build output
COPY ${outputDir} /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
`
  }

  await fs.writeFile(path.join(workDir, "Dockerfile"), dockerfile)
  logger.info(`Dockerfile created (${isNextStandalone ? "Next.js standalone" : "static"})`)
}

/**
 * Create nginx.conf for SPA routing
 */
async function createNginxConfig(workDir: string): Promise<void> {
  const nginxConf = `server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SPA routing - fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \\.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
`

  await fs.writeFile(path.join(workDir, "nginx.conf"), nginxConf)
  logger.info("nginx.conf created")
}

/**
 * Build Docker image
 */
export async function buildDockerImage(
  deployInfo: DeploymentInfo,
  outputDir: string,
): Promise<void> {
  const { workDir, containerName, sha } = deployInfo
  const imageName = `${containerName}:${sha.substring(0, 7)}`
  const isNextStandalone = outputDir.includes(".next/standalone")

  logger.info(`Building Docker image: ${imageName}`)

  // Create Dockerfile
  await createDockerfile(workDir, outputDir)

  // Only create nginx.conf for static sites
  const srcFiles = ["Dockerfile", outputDir]
  if (!isNextStandalone) {
    await createNginxConfig(workDir)
    srcFiles.push("nginx.conf")
  }

  // For Next.js standalone, include additional directories
  if (isNextStandalone) {
    const appDir = outputDir.replace("/.next/standalone", "")
    srcFiles.push(`${appDir}/.next/static`)
    srcFiles.push(`${appDir}/public`)
  }

  // Build image using tar stream
  const tarStream = await docker.buildImage(
    {
      context: workDir,
      src: srcFiles,
    },
    {
      t: imageName,
    },
  )

  // Wait for build to complete
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(
      tarStream,
      (err, result) => {
        if (err) {
          reject(err)
        } else {
          resolve(result)
        }
      },
      (event) => {
        if (event.stream) {
          logger.debug(event.stream.trim())
        }
      },
    )
  })

  logger.info(`Docker image built successfully: ${imageName}`)
}

/**
 * Stop and remove existing container
 */
export async function cleanupContainer(containerName: string): Promise<void> {
  try {
    const container = docker.getContainer(containerName)

    // Check if container exists
    try {
      await container.inspect()
    } catch {
      // Container doesn't exist, nothing to clean up
      return
    }

    // Stop container
    logger.info(`Stopping container: ${containerName}`)
    try {
      await container.stop()
    } catch (error) {
      // Container might already be stopped
      logger.debug(`Container ${containerName} already stopped or doesn't exist`)
    }

    // Remove container
    logger.info(`Removing container: ${containerName}`)
    await container.remove()
  } catch (error) {
    logger.error(`Failed to cleanup container ${containerName}:`, error)
  }
}

/**
 * Run Docker container with Traefik labels
 */
export async function runContainer(
  deployInfo: DeploymentInfo,
  outputDir?: string,
): Promise<void> {
  const { containerName, subdomain, sha } = deployInfo
  const imageName = `${containerName}:${sha.substring(0, 7)}`

  // Determine port based on build type
  const isNextStandalone = outputDir?.includes(".next/standalone")
  const containerPort = isNextStandalone ? "3000" : "80"

  logger.info(`Starting container: ${containerName} (port: ${containerPort})`)

  // Stop and remove existing container
  await cleanupContainer(containerName)

  // Run new container
  const container = await docker.createContainer({
    name: containerName,
    Image: imageName,
    Labels: {
      "traefik.enable": "true",
      [`traefik.http.routers.${containerName}.rule`]: `Host(\`${subdomain}\`)`,
      [`traefik.http.routers.${containerName}.entrypoints`]: "web",
      [`traefik.http.services.${containerName}.loadbalancer.server.port`]: containerPort,
    },
    HostConfig: {
      NetworkMode: config.dockerNetworkName,
      RestartPolicy: {
        Name: "unless-stopped",
      },
      // Resource limits
      Memory: 512 * 1024 * 1024, // 512MB
      NanoCpus: 0.5 * 1e9, // 0.5 CPU
    },
  })

  await container.start()

  logger.info(`Container started: ${containerName}`)
  logger.info(`Accessible at: http://${subdomain}`)
}

/**
 * Create Docker network if it doesn't exist
 */
export async function ensureDockerNetwork(): Promise<void> {
  try {
    const network = docker.getNetwork(config.dockerNetworkName)
    await network.inspect()
    logger.info(`Docker network ${config.dockerNetworkName} already exists`)
  } catch {
    logger.info(`Creating Docker network: ${config.dockerNetworkName}`)
    await docker.createNetwork({
      Name: config.dockerNetworkName,
      Driver: "bridge",
    })
    logger.info(`Docker network created: ${config.dockerNetworkName}`)
  }
}
