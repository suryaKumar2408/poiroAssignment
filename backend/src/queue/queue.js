const { Queue } = require("bullmq")

/**
 * Parse REDIS_URL into BullMQ's ioredis connection options.
 * BullMQ requires the connection object format, not a raw URL string.
 */
function getRedisConnection() {
  const url = process.env.REDIS_URL || "redis://localhost:6379"
  try {
    const parsed = new URL(url)
    return {
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      tls: parsed.protocol === "rediss:" ? {} : undefined,
    }
  } catch {
    return { host: "127.0.0.1", port: 6379 }
  }
}

const redisConnection = getRedisConnection()

const aiQueue = new Queue("ai-jobs", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
})

console.log("[Queue] BullMQ 'ai-jobs' queue initialized")

module.exports = { aiQueue, redisConnection }
