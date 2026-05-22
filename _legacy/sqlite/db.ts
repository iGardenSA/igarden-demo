import Database from "better-sqlite3";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Singleton — Next dev re-imports modules, so cache on globalThis.
const g = globalThis as unknown as { __igardenDb?: Database.Database };

const DB_PATH = process.env.IGARDEN_DB_PATH
  ?? join(process.cwd(), "data", "igarden-demo.db");

const SCHEMA_PATH = join(process.cwd(), "data", "schema.sql");

export function getDb(): Database.Database {
  if (g.__igardenDb) return g.__igardenDb;

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Ensure schema exists (idempotent — schema.sql uses IF NOT EXISTS).
  if (existsSync(SCHEMA_PATH)) {
    const ddl = readFileSync(SCHEMA_PATH, "utf8");
    db.exec(ddl);
  }

  g.__igardenDb = db;
  return db;
}

/**
 * Reset DB completely. Used by seed script and the dev /api/seed route only.
 * Never call from request handlers in production paths.
 */
export function resetDb(): Database.Database {
  if (g.__igardenDb) {
    g.__igardenDb.close();
    g.__igardenDb = undefined;
  }
  // Use file system to drop the database
  try {
    const fs = require("node:fs") as typeof import("node:fs");
    [DB_PATH, `${DB_PATH}-shm`, `${DB_PATH}-wal`, `${DB_PATH}-journal`].forEach((p) => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
  } catch {
    // ignore — fresh boot
  }
  return getDb();
}
