import { join } from "node:path";
import { mkdirSync } from "node:fs";

// Each test file gets its own isolated DB.
const dir = join(process.cwd(), "tests", ".tmp");
mkdirSync(dir, { recursive: true });
process.env.IGARDEN_DB_PATH = join(dir, `test-${process.pid}.db`);
