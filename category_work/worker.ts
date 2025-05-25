import { parentPort } from "worker_threads";
import { Post, ProcessedResult } from "./types";
import { processPost } from "./utils";

if (parentPort) {
  parentPort.on("message", async (data: Post[]) => {
    try {
      const results: ProcessedResult[] = [];
      for (const post of data) {
        const result = await processPost(post);
        if (result) {
          results.push(result);
          console.log("Results:", results);
        }
      }
      parentPort.postMessage({ results });
    } catch (error) {
      parentPort.postMessage({ error: (error as Error).message });
    }
  });
}
