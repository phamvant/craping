import fs from "fs/promises";
import cheerio from "cheerio";
import postgres from "./db";
import { ServerBlockNoteEditor } from "@blocknote/server-util";

const addLeadingZeros = (num) => {
  return String(num).padStart(6, "0");
};

const rename = async () => {
  const file = await fs.readFile("contents.json");

  const posts = JSON.parse(file.toString())["posts"] as string[];

  let i = 1;
  for (let post of posts) {
    const id = post.split("/")[2].split(".")[0];
    const newPath = post.replace(id, addLeadingZeros(i));
    await fs.rename("./result/" + post, "./result/" + newPath);
    i++;
    console.log(id);
  }
  fs.writeFile("log.txt", i.toString());
};

const insertToTable = async () => {
  const file = await fs.readFile("contents.json");

  const posts = JSON.parse(file.toString())["posts"] as string[];

  for (let post of posts) {
    try {
      const category = post.split("/")[1];

      const html = (await fs.readFile("./result/" + post)).toString();

      const $ = cheerio.load(html);

      const title = $("h1.aTitle").text().trim();
      const editor = ServerBlockNoteEditor.create();
      const block = await editor.tryParseHTMLToBlocks(html);
      const markdown = await editor.blocksToMarkdownLossy(block);

      const ret = await postgres.query(
        `INSERT INTO public.post (title, content, is_scrap, category_id, is_published, author_id)
        VALUES
            (
                $1,
                $2,
                TRUE,
                1,
                TRUE,
                '108543290814069582461'
            )`,
        [title, markdown]
      );

      console.log(post);
    } catch (e) {
      console.log(e);
    }
  }
};

insertToTable();

// rename();
