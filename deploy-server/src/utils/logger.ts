import winston from "winston"
import { config } from "../config.js"

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    // File output
    new winston.transports.File({
      filename: `${config.logDir}/error.log`,
      level: "error",
    }),
    new winston.transports.File({
      filename: `${config.logDir}/combined.log`,
    }),
  ],
})
