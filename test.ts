import * as fs from "fs/promises";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  password: "thuan286",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

// Define the structure of your JSON objects
interface JsonItem {
  id: string;
  title: string;
  content: string;
}

// Define the structure of a Batch API request
interface BatchRequest {
  custom_id: string;
  method: string;
  url: string;
  body: {
    model: string;
    messages: { role: string; content: string }[];
  };
}

interface Result {
  id: string;
  custom_id: string;
  response: {
    status_code: number;
    request_id: string;
    body: {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: {
        index: number;
        message: { role: string; content: string };
        finish_reason: string;
      }[];
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  };
}

// Function to generate batch requests
async function generateBatchRequests(
  inputFile: string,
  outputFile: string
): Promise<void> {
  try {
    // Read and parse the input JSON file
    const rawData = await fs.readFile(inputFile, "utf-8");
    const jsonData: JsonItem[] = JSON.parse(rawData);

    // Array to store batch requests
    const requests: BatchRequest[] = [];

    // Iterate through each item in the JSON array
    jsonData.forEach((item) => {
      // Request for translating the title
      requests.push({
        custom_id: `${item.id}-title`,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that translates Chinese text to Vietnamese. You can make the translation more accurate by adding more context to the translation.
              Please translate the text naturally, prioritizing clarity and ease of understanding over literal, word-for-word translation. Ensure the meaning is preserved while adapting to the target language's natural flow and expressions
              Do not add any other text.  `,
            },
            {
              role: "user",
              content: `Translate the following Chinese text to Vietnamese: ${item.title}`,
            },
          ],
        },
      });

      // Request for translating the content
      requests.push({
        custom_id: `${item.id}-content`,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `You are a helpful assistant that translates Chinese text to Vietnamese. You can make the translation more accurate by adding more context to the translation.
              Please translate the text naturally, prioritizing clarity and ease of understanding over literal, word-for-word translation. Ensure the meaning is preserved while adapting to the target language's natural flow and expressions.
              Do not add any other text.  `,
            },
            {
              role: "user",
              content: `Translate the following Chinese text to Vietnamese: ${item.content}`,
            },
          ],
        },
      });
    });

    // Write requests to a JSONL file
    const jsonlContent = requests
      .map((request) => JSON.stringify(request))
      .join("\n");
    await fs.writeFile(outputFile, jsonlContent, "utf-8");

    console.log(`Batch request file '${outputFile}' created successfully.`);
  } catch (error) {
    console.error("Error generating batch requests:", error);
  }
}

async function parseResult(inputFile: string) {
  const rawData = await fs.readFile(inputFile, "utf-8");

  const client = await pool.connect();
  try {
    const jsonData: Result[] = JSON.parse(rawData);
    const newData: { [key: string]: { title: string; content: string } } = {};

    for (const item of jsonData) {
      const isTitle = item.custom_id.includes("title");
      if (isTitle) {
        const postId = item.custom_id.split("-title")[0];
        if (!newData[postId]) {
          newData[postId] = { title: "", content: "" };
        }
        newData[postId].title = item.response.body.choices[0].message.content;
      } else {
        const postId = item.custom_id.split("-content")[0];
        if (!newData[postId]) {
          newData[postId] = { title: "", content: "" };
        }
        newData[postId].content = item.response.body.choices[0].message.content;
      }
    }

    for (const postId in newData) {
      const oldData = await client.query(`SELECT * FROM posts WHERE id = $1`, [
        postId,
      ]);

      if (oldData.rows.length > 0) {
        const data = oldData.rows[0];
        data.title.vi = newData[postId].title;
        data.content.vi = newData[postId].content;
        const result = await client.query(
          `UPDATE posts
       SET title = $1::jsonb, content = $2::jsonb
       WHERE id = $3`,
          [JSON.stringify(data.title), JSON.stringify(data.content), postId]
        );
      }

      console.log("Updated post", postId);
    }

    // await pool.query(
    //   `UPDATE posts
    //  SET title = $1::jsonb, content = $2::jsonb
    //  WHERE id = $3`,
    //   [JSON.stringify(post.title), JSON.stringify(post.content), post.id]
    // );

    // await fs.writeFile(
    //   "output.json",
    //   JSON.stringify(newData, null, 2),
    //   "utf-8"
    // );
  } catch (error) {
    console.log("Problematic JSON snippet:", rawData.slice(940, 960));
  }
}

// Run the function with input and output file paths
// generateBatchRequests("posts.json", "batch_requests.jsonl");
parseResult("batch_results_vi.json");
