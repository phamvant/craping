import { Pool } from "pg";

// Create a new pool instance
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "thuan286",
  port: 5432,
});

/**
 * Execute a query with parameters
 */
export async function query<T = any>(
  text: string,
  params: any[] = []
): Promise<T[]> {
  const start = Date.now();
  const client = await pool.connect();
  try {
    // Enable statement timeout to prevent long-running queries
    await client.query("SET statement_timeout = 5000"); // 5 seconds
    const result = await client.query(text, params);
    return result.rows as T[];
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  } finally {
    client.release();
  }
}
