import { lchown } from "fs";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "thuan286",
  port: 5432,
});

const replace = async (errorSchoolIds: string[], correctSchoolIds: string) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    const post_tags = await client.query(
      `SELECT post_id, tag_id FROM post_tags WHERE tag_id = ANY($1)`,
      [errorSchoolIds]
    );

    // if (!post_tags.rows.length) {
    //   const deleteErrorSchool = await client.query(
    //     `DELETE FROM schools WHERE tag_id = ANY($1)`,
    //     [errorSchoolIds]
    //   );

    //   const deleteErrorTag = await client.query(
    //     `DELETE FROM tags WHERE id = ANY($1)`,
    //     [errorSchoolIds]
    //   );

    //   console.log("deleted", errorSchoolIds);
    // }

    console.log(post_tags.rows);
    for (const post_tag of post_tags.rows) {
      const res = await client.query(
        `UPDATE post_tags SET tag_id = $1 WHERE post_id = $2 AND tag_id = $3`,
        [correctSchoolIds, post_tag.post_id, post_tag.tag_id]
      );

      console.log("updatedPost", post_tag.post_id);
      const post = await client.query(`SELECT title FROM posts WHERE id = $1`, [
        post_tag.post_id,
      ]);

      const updatedPostTag = await client.query(
        `UPDATE posts SET updated_at = NOW() WHERE id = $1`,
        [post_tag.post_id]
      );

      const deleteErrorSchool = await client.query(
        `DELETE FROM schools WHERE tag_id = ANY($1)`,
        [errorSchoolIds]
      );

      const deleteErrorTag = await client.query(
        `DELETE FROM tags WHERE id = ANY($1)`,
        [errorSchoolIds]
      );
    }
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
  await client.query("COMMIT");
  console.log("Done");
  process.exit(0);
};

replace(
  [
    "b31b6bf8-37c1-448f-b170-8bd09ce30264",
    "b47878dd-275b-4ff7-8e70-5f2cf32b4121",
    "653d37a9-3e84-43ba-a9c5-b948bdf0ec7c",
    "edc81dcd-babe-495c-857e-eeb252ba90c9",
    "e77fad64-3851-4a60-a8f9-e73c1924c51f",
  ],
  "a7faf8b7-70c8-4e2b-b35a-fd839cc6a270"
);
