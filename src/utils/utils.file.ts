import fs from "fs/promises";
import cheerio from "cheerio";
import postgres from "./db";
import { ServerBlockNoteEditor } from "@blocknote/server-util";
import path from "path";

const insertToTable = async (categoryId: number) => {
  const posts = await fs.readdir("en");

  for (let post of posts) {
    try {
      const html_cn = (await fs.readFile(path.join("cn", post))).toString();
      const html_en = (await fs.readFile(path.join("en", post))).toString();
      const html_vn = (await fs.readFile(path.join("vn", post))).toString();

      const editor = ServerBlockNoteEditor.create();

      const $cn = cheerio.load(html_cn);
      const title_cn = $cn("h1.aTitle").text().trim();
      const block_cn = await editor.tryParseHTMLToBlocks(html_cn);
      const markdown_cn = await editor.blocksToMarkdownLossy(block_cn);

      const $en = cheerio.load(html_en);
      const title_en = $en("h1.aTitle").text().trim();
      const block_en = await editor.tryParseHTMLToBlocks(html_en);
      const markdown_en = await editor.blocksToMarkdownLossy(block_en);

      const $vn = cheerio.load(html_vn);
      const title_vn = $vn("h1.aTitle").text().trim();
      const block_vn = await editor.tryParseHTMLToBlocks(html_vn);
      const markdown_vn = await editor.blocksToMarkdownLossy(block_vn);

      const date = post.match(/\d{4}-\d{2}-\d{2}/)[0];

      const postRet = await postgres.query(
        `INSERT INTO "post" (category_id, is_published, author_id, created_at)
        VALUES ($1, TRUE, '108543290814069582461', $2)
        RETURNING id`,
        [categoryId, date]
      );

      let insertedId;
      if (!postRet.rowCount) {
        console.log("Error", post);
        continue;
      } else {
        insertedId = postRet.rows[0].id;
      }

      const post_univeral_cn = await postgres.query(
        `INSERT INTO "post_universal" (post_id, title, content, lang)
        VALUES ($1, $2, $3, 'cn')`,
        [insertedId, title_cn, markdown_cn]
      );

      const post_univeral_en = await postgres.query(
        `INSERT INTO "post_universal" (post_id, title, content, lang)
        VALUES ($1, $2, $3, 'en')`,
        [insertedId, title_en, markdown_en]
      );

      const post_univeral_vn = await postgres.query(
        `INSERT INTO "post_universal" (post_id, title, content, lang)
        VALUES ($1, $2, $3, 'vn')`,
        [insertedId, title_vn, markdown_vn]
      );

      console.log(post);
    } catch (e) {
      console.log(e);
    }
  }
};

insertToTable(18);

// rename();
