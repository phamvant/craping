import { Pool } from "pg";
import fs from "fs/promises";

const pg = new Pool({
  user: "postgres",
  password: "thuan286",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

async function getPost() {
  const client = await pg.connect();
  try {
    // Create output directory if it doesn't exist

    const result = await client.query(`
        SELECT 
          id,
          title,
          content,
          created_at
        FROM posts 
        WHERE created_at > '2021-01-01'
        AND created_at < '2022-01-01'
        ORDER BY created_at DESC
      `);

    const posts = result.rows.map((post) => ({
      id: post.id,
      title: post.title.zh,
      content: post.content.zh,
    }));

    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    throw error;
  }
}

async function main() {
  const posts = await getPost();

  await fs.writeFile(`./posts2.json`, JSON.stringify(posts, null, 2));
  process.exit(0);
}

main();
