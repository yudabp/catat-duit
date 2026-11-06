import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const cwd = process.cwd();
dotenv.config({ path: path.resolve(cwd, ".env.local"), quiet: true });
dotenv.config({ path: path.resolve(cwd, ".env"), quiet: true });
dotenv.config({ path: path.resolve(cwd, "../.env.local"), quiet: true });
dotenv.config({ path: path.resolve(cwd, "../.env"), quiet: true });

const databaseUrl =
  process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL belum diisi");
}

const isSsl =
  process.env.DB_SSL === "true" ||
  databaseUrl.includes("sslmode=require") ||
  databaseUrl.includes("neon.tech");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : undefined,
  },
  strict: true,
  verbose: true,
});
