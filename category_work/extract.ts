import * as fs from "fs/promises";
import { Pool } from "pg";
import { Worker } from "worker_threads";
import { cpus } from "os";
import path from "path";
import { Post, ProcessedResult } from "./types";
import { updateSharedData } from "./utils";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const pg = new Pool({
  user: "postgres",
  password: "thuan286",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

/**
 * Atomic file writing with retry mechanism
 */
async function atomicWriteFile(
  filePath: string,
  data: any,
  retries = MAX_RETRIES
): Promise<void> {
  const tempPath = `${filePath}.tmp`;
  try {
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), "utf-8");
    await fs.rename(tempPath, filePath);
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return atomicWriteFile(filePath, data, retries - 1);
    }
    throw error;
  }
}

/**
 * Main processing function with parallel execution
 */
async function getPost() {
  const client = await pg.connect();
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir("./output", { recursive: true });

    const result = await client.query(`
      SELECT 
        id,
        title,
        content,
        created_at
      FROM posts 
      WHERE created_at > '2020-01-01'
      AND created_at < '2023-01-01'
      ORDER BY created_at DESC
    `);

    const posts = result.rows.map((post) => ({
      id: post.id,
      title: {
        zh: post.title.zh,
        vi: post.title.vi,
        en: post.title.en,
      },
      content: {
        zh: post.content.zh,
        vi: post.content.vi,
        en: post.content.en,
      },
      created_at: post.created_at,
    })) as Post[];

    const skippedIds: string[] = [];
    const filteredPosts = posts.filter((post) => {
      if (post.content.en.length < 5000 && post.content.en.length > 0) {
        return true;
      }
      skippedIds.push(post.id);
      return false;
    });

    console.log("Skipped posts:", posts.length - filteredPosts.length);
    console.log("Total posts:", posts.length);

    // Split posts into chunks for parallel processing
    const numCPUs = cpus().length;
    const chunks: Post[][] = Array.from({ length: numCPUs }, () => []);
    filteredPosts.forEach((post, index) => {
      chunks[index % numCPUs].push(post);
    });

    // Shared data structures
    const finalResults: ProcessedResult[] = [];
    const processedIds: string[] = [];
    const schoolsMap = new Map<string, string>();
    const nationMap = new Map<string, string[]>();

    // Process chunks in parallel using worker threads
    const workers = chunks.map((chunk, index) => {
      return new Promise((resolve, reject) => {
        const worker = new Worker(path.join(__dirname, "worker.ts"), {
          execArgv: ["-r", "ts-node/register"],
        });

        worker.on("message", async (message) => {
          if (message.error) {
            reject(new Error(message.error));
          } else {
            for (const result of message.results) {
              finalResults.push(result);
              processedIds.push(result.postId);
              await updateSharedData(result, schoolsMap, nationMap);
            }
            resolve(true);
          }
        });

        worker.on("error", reject);
        worker.postMessage(chunk);
      });
    });

    await atomicWriteFile("./output/skipped_ids.json", skippedIds);
    // Wait for all workers to complete
    await Promise.all(workers);

    // Write results atomically
    await Promise.all([
      atomicWriteFile("./output/extract_result.json", finalResults),
      atomicWriteFile("./output/processed_ids.json", processedIds),
      atomicWriteFile(
        "./output/schools_map.json",
        Object.fromEntries(schoolsMap)
      ),
      atomicWriteFile(
        "./output/nation_map.json",
        Object.fromEntries(nationMap)
      ),
    ]);

    console.log("Processing completed successfully");
  } catch (error) {
    console.error("Error in getPost:", error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the main function
getPost().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
