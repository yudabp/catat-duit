import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import { db, pool, schema } from "./index.js";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../drizzle");

export async function runMigrations(): Promise<void> {
  const migrationUrl = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
  const isSsl =
    env.DB_SSL ||
    migrationUrl.includes("sslmode=require") ||
    migrationUrl.includes("neon.tech");

  if (env.DATABASE_URL_UNPOOLED) {
    const migrationPool = new Pool({
      connectionString: env.DATABASE_URL_UNPOOLED,
      max: 1,
      connectionTimeoutMillis: 10_000,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
    });
    const migrationDb = drizzle(migrationPool, { schema });
    try {
      await migrate(migrationDb, { migrationsFolder });
    } finally {
      await migrationPool.end();
    }
  } else {
    await migrate(db, { migrationsFolder });
  }
}

async function main(): Promise<void> {
  try {
    await runMigrations();
    console.log("Migrasi database selesai.");
  } finally {
    await pool.end();
  }
}

const isDirectRun =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  main().catch((error) => {
    console.error("Migrasi gagal:", error);
    process.exitCode = 1;
  });
}
