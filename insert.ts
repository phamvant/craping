import { Pool } from "pg";
import fs from "fs/promises";

const pg = new Pool({
  user: "postgres",
  password: "thuan286",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

interface Data {
  nation: string;
  nationCode: string;
  schools: string[];
}

async function schools() {
  const data = await fs.readFile("nation_list.json", "utf-8");
  const jsonData = JSON.parse(data) as Data[];

  let i = 0;
  for (const item of jsonData) {
    const { nation, nationCode, schools } = item;

    console.log("Processing ", i++, " of ", jsonData.length);

    const client = await pg.connect();
    try {
      await client.query("BEGIN");

      for (const school of schools) {
        await client.query(
          `INSERT INTO schools (schoolname, nation, nationcode) VALUES ($1, $2, $3)`,
          [school, nation, nationCode]
        );
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}

async function tags() {
  const data = await fs.readFile("nation_list.json", "utf-8");
  const jsonData = JSON.parse(data) as Data[];

  let i = 0;
  const uniqueNation = new Set<string>();
  for (const item of jsonData) {
    const { nation } = item;

    console.log("Processing ", i++, " of ", jsonData.length);

    uniqueNation.add(nation);
  }

  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    for (const nation of uniqueNation) {
      await client.query(`INSERT INTO tags (name) VALUES ($1)`, [nation]);
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

interface SchoolsTable {
  schoolcode: string;
  schoolname: string;
  nation: string;
  nationcode: string;
}

interface PostInfo {
  id: string;
  schools: string[];
  nations: string[];
}

interface TagTable {
  id: number;
  name: string;
}

async function main() {
  const client = await pg.connect();
  const tags = await client.query(`SELECT * FROM tags`);
  let tagInfo: TagTable[] = [];

  if (tags.rows.length > 0) {
    tagInfo = tags.rows.map((row) => ({
      id: row.id,
      name: row.name,
    }));
  } else {
    process.exit(0);
  }

  const postInfo = await fs.readFile("final_results.json", "utf-8");
  const postInfoJson = JSON.parse(postInfo) as PostInfo[];

  for (const post of postInfoJson) {
    const { id, schools, nations } = post;

    const client = await pg.connect();
    try {
      await client.query("BEGIN");

      for (const nation of nations) {
        const tag = tagInfo.find((tag) => tag.name === nation);
        if (tag) {
          await client.query(
            `INSERT INTO post_tags (post_id, tag_id) VALUES ($1, $2)`,
            [id, tag.id]
          );
        }
      }

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}

main();
