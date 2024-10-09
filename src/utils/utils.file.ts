import fs from "fs/promises";
import cheerio from "cheerio";
import postgres from "./db";
import { ServerBlockNoteEditor } from "@blocknote/server-util";
import path from "path";

const mapping = [
  // [28, 25],
  // [14, 11],
  // [15, 12],
  // [16, 13],
  // [17, 14],
  // [18, 15],
  // [19, 16],
  // [20, 17],
  // [21, 18],
  // [22, 19],
  // [23, 20],
  // [24, 21],
  // [25, 22],
  // [29, 26],
  // [51, 34],
  [66, 36],
];

const insertToTable = async () => {
  for (let [origin, mapto] of mapping) {
    const posts = await fs.readdir(`data/cn/${origin}_cn`);

    for (let post of posts) {
      try {
        let html_cn;
        let html_en;
        let html_vn;

        try {
          html_cn = (
            await fs.readFile(path.join("data", "cn", `${origin}_cn`, post))
          ).toString();
        } catch (e) {
          html_cn = null;
        }

        try {
          html_en = (
            await fs.readFile(path.join("data", "en", `${origin}_en`, post))
          ).toString();
        } catch (e) {
          html_en = null;
        }

        try {
          html_vn = (
            await fs.readFile(path.join("data", "vn", `${origin}_vn`, post))
          ).toString();
        } catch (e) {
          html_vn = null;
        }

        const editor = ServerBlockNoteEditor.create();

        const date = post.match(/\d{4}-\d{2}-\d{2}/)[0];

        const postRet = await postgres.query(
          `INSERT INTO "post" (category_id, is_published, author_id, created_at)
        VALUES ($1, TRUE, '108543290814069582461', $2)
        RETURNING id`,
          [mapto, date],
        );

        let insertedId;

        if (!postRet.rowCount) {
          console.log("Error", post);
          continue;
        } else {
          insertedId = postRet.rows[0].id;
        }

        if (html_cn) {
          const $cn = cheerio.load(html_cn);
          const title_cn = $cn("h1.aTitle").text().trim();
          const block_cn = await editor.tryParseHTMLToBlocks(html_cn);
          const markdown_cn = await editor.blocksToMarkdownLossy(block_cn);

          const post_univeral_cn = await postgres.query(
            `INSERT INTO "post_universal" (post_id, title, content, lang)
            VALUES ($1, $2, $3, 'cn')`,
            [insertedId, title_cn, markdown_cn],
          );
        } else {
          const post_univeral_cn = await postgres.query(
            `INSERT INTO "post_universal" (post_id, lang)
            VALUES ($1, 'cn')`,
            [insertedId],
          );
        }

        if (html_en) {
          const $en = cheerio.load(html_en);
          const title_en = $en("h1.aTitle").text().trim();
          const block_en = await editor.tryParseHTMLToBlocks(html_en);
          const markdown_en = await editor.blocksToMarkdownLossy(block_en);

          const post_univeral_en = await postgres.query(
            `INSERT INTO "post_universal" (post_id, title, content, lang)
          VALUES ($1, $2, $3, 'en')`,
            [insertedId, title_en, markdown_en],
          );
        } else {
          const post_univeral_en = await postgres.query(
            `INSERT INTO "post_universal" (post_id, lang)
          VALUES ($1, 'en')`,
            [insertedId],
          );
        }

        if (html_vn) {
          const $vn = cheerio.load(html_vn);
          const title_vn = $vn("h1.aTitle").text().trim();
          const block_vn = await editor.tryParseHTMLToBlocks(html_vn);
          const markdown_vn = await editor.blocksToMarkdownLossy(block_vn);

          const post_univeral_vn = await postgres.query(
            `INSERT INTO "post_universal" (post_id, title, content, lang)
          VALUES ($1, $2, $3, 'vn')`,
            [insertedId, title_vn, markdown_vn],
          );
        } else {
          const post_univeral_vn = await postgres.query(
            `INSERT INTO "post_universal" (post_id, lang)
          VALUES ($1, 'vn')`,
            [insertedId],
          );
        }

        console.log(post);
      } catch (e) {
        console.log(e);
        process.exit(0);
      }
    }
  }
};

insertToTable();
