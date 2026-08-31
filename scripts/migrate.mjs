import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import postgres from "postgres";

const dir = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(dir, "..", "migrations");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const contents = readFileSync(path.join(migrationsDir, file), "utf8");
  console.log(`Running ${file}...`);
  await sql.unsafe(contents);
}

console.log("Migrations complete.");
await sql.end();
