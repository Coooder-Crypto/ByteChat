import pg from "pg";
import { config } from "./config.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("Unexpected PG error", err);
});

export async function initDb() {
  // Keep lean; migrations handled via schema.sql or your toolchain.
  await pool.query("select 1");
}
