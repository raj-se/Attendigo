import postgres from "postgres";

// Lazily-created singleton so we don't open a connection at build/import time.
declare global {
  // eslint-disable-next-line no-var
  var __sql: ReturnType<typeof postgres> | undefined;
}

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment (see .env.example)."
    );
  }
  return postgres(url, {
    ssl: "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });
}

export const sql = global.__sql ?? createClient();
if (process.env.NODE_ENV !== "production") {
  global.__sql = sql;
}
