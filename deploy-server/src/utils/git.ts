import fs from "node:fs/promises"
import { simpleGit } from "simple-git"
import { config } from "../config.js"
import { logger } from "./logger.js"
import type { BuildResult, DeploymentInfo } from "../types.js"
import { exec } from "node:child_process"
import { promisify } from "node:util"

const execAsync = promisify(exec)

/**
 * Clone repository to work directory
 */
export async function cloneRepository(deployInfo: DeploymentInfo): Promise<void> {
  const { branch, workDir } = deployInfo

  logger.info(`Cloning repository branch ${branch} to ${workDir}`)

  // Clean up existing directory
  try {
    await fs.rm(workDir, { recursive: true, force: true })
  } catch (error) {
    // Ignore if directory doesn't exist
  }

  // Create work directory
  await fs.mkdir(workDir, { recursive: true })

  // Clone repository
  const git = simpleGit()
  await git.clone(config.repoSshUrl, workDir, [
    "--depth",
    "1",
    "--branch",
    branch,
    "--single-branch",
  ])

  logger.info(`Repository cloned successfully to ${workDir}`)
}

/**
 * Build the project using pnpm
 */
export async function buildProject(deployInfo: DeploymentInfo): Promise<BuildResult> {
  const { workDir } = deployInfo
  const startTime = Date.now()

  logger.info(`Building project in ${workDir}`)

  try {
    // Install dependencies
    logger.info("Running pnpm install...")
    const { stdout: installOutput, stderr: installError } = await execAsync(
      "pnpm install --frozen-lockfile",
      {
        cwd: workDir,
        timeout: config.buildTimeout,
      },
    )

    if (installError) {
      logger.debug("pnpm install stderr:", installError)
    }
    logger.debug("pnpm install stdout:", installOutput)

    // Build project
    logger.info("Running pnpm build...")
    const { stdout: buildOutput, stderr: buildError } = await execAsync("pnpm build", {
      cwd: workDir,
      timeout: config.buildTimeout,
    })

    if (buildError) {
      logger.debug("pnpm build stderr:", buildError)
    }
    logger.debug("pnpm build stdout:", buildOutput)

    // Check for build output
    const possibleDirs = ["dist", ".next", "build", "out"]
    let outputDir: string | undefined

    for (const dir of possibleDirs) {
      try {
        const fullPath = `${workDir}/${dir}`
        const stats = await fs.stat(fullPath)
        if (stats.isDirectory()) {
          outputDir = dir
          break
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    if (!outputDir) {
      throw new Error("No build output directory found (checked: dist, .next, build, out)")
    }

    const duration = Date.now() - startTime
    logger.info(`Build completed successfully in ${duration}ms. Output: ${outputDir}`)

    return {
      success: true,
      duration,
      outputDir,
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : String(error)

    logger.error(`Build failed after ${duration}ms:`, errorMessage)

    return {
      success: false,
      error: errorMessage,
      duration,
    }
  }
}
