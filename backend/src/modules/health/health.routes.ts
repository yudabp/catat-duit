import { sql } from "drizzle-orm";
import { Router } from "express";
import { env } from "../../config/env.js";
import { db } from "../../db/index.js";
import { logger } from "../../lib/logger.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  const startedAt = process.uptime();

  try {
    const result = await db.execute(sql`select version()`);
    const versionRow = result.rows[0] as { version?: string } | undefined;
    res.json({
      status: "ok",
      database: "up",
      databaseVersion: versionRow?.version,
      uptimeSeconds: Math.round(startedAt),
      timestamp: new Date().toISOString(),
      ...(env.NEON_BRANCH
        ? {
            neon: {
              branch: env.NEON_BRANCH,
              authUrl: env.NEON_AUTH_BASE_URL,
            },
          }
        : {}),
    });
  } catch (error) {
    logger.error({ err: error }, "Health check database gagal");
    res.status(503).json({
      status: "unavailable",
      database: "down",
      uptimeSeconds: Math.round(startedAt),
      timestamp: new Date().toISOString(),
    });
  }
});
