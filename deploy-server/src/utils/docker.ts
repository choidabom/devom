import Dockerode from "dockerode"
import { config } from "../config.js"
import { logger } from "./logger.js"
import type { DeploymentInfo } from "../types.js"
import fs from "node:fs/promises"
import path from "node:path"

const docker = new Dockerode()

/**
 * Create Dockerfile for static site
 */
async function createDockerfile(workDir: string, outputDir: string): Promise<void> {
  const dockerfile = `FROM nginx:alpine

# Copy build output
COPY ${outputDir} /usr/share/nginx/html

# Copy nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
`

  await fs.writeFile(path.join(workDir, "Dockerfile"), dockerfile)
  logger.info("Dockerfile created")
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

  logger.info(`Building Docker image: ${imageName}`)

  // Create Dockerfile and nginx.conf
  await createDockerfile(workDir, outputDir)
  await createNginxConfig(workDir)

  // Build image using tar stream
  const tarStream = await docker.buildImage(
    {
      context: workDir,
      src: ["Dockerfile", "nginx.conf", outputDir],
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
export async function runContainer(deployInfo: DeploymentInfo): Promise<void> {
  const { containerName, subdomain, sha } = deployInfo
  const imageName = `${containerName}:${sha.substring(0, 7)}`

  logger.info(`Starting container: ${containerName}`)

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
      [`traefik.http.services.${containerName}.loadbalancer.server.port`]: "80",
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
