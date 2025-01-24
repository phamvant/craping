import { readFileSync, writeFileSync } from "fs";
import { JSDOM } from "jsdom";

const html = readFileSync("./gmat/utils/index.html", "utf-8");
const dom = new JSDOM(html);

const document = dom.window.document;

const read = [655, 555, 500];

const tbody = document.querySelectorAll("tbody");
const tr = tbody[2].querySelectorAll("tr");

read.forEach((cate, idx) => {
  const td = tr[idx + 2].querySelectorAll("td")[1];
  const li = td.querySelectorAll("li");

  const data = [...li].map((val) => {
    const aTag = val.querySelector("a");
    console.log(aTag?.href);
    return { topic: aTag?.textContent, link: aTag?.href };
  });

  const ret = `export const a${cate} = ` + JSON.stringify(data);

  writeFileSync(`./gmat/input/RC/${cate}.ts`, ret);
});
