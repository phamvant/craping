import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { loadCookies, loadLocalStorage, scrapeData } from "./GMAT";
import { a500 } from "./input/500";

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await loadCookies(page);
  await loadLocalStorage(page);

  let ret = {};
  for (const val of a500) {
    await page.goto(val.link, {
      waitUntil: "networkidle2",
    });

    const postLinks = await page.evaluate(() => {
      const listItems = document.querySelectorAll(".topicsName"); // Select all elements with class .topicsName
      return Array.from(listItems)
        .map((item) => {
          const link = item.querySelector("a"); // Get the first <a> tag within the current item
          return link ? link.href : null; // Return the href if the link exists, else return null
        })
        .filter((href) => href !== null); // Filter out any null values
    });

    ret[val.topic] = [];
    for (const post of postLinks) {
      try {
        if (post) {
          const data = await scrapeData(page, post);
          if (data) {
            ret[val.topic].push(data);
            await writeFile(
              "./gmat/output/data500.json",
              JSON.stringify(ret, null, 2),
            );
          }
        }
      } catch (err) {}
    }
  }

  await browser.close();
})();
