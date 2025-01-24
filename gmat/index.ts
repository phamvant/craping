import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import { scrapeData } from "./utils/transform/transform_general";
import { a500 } from "./input/RC/500";
import { a555 } from "./input/RC/555";
import { a655 } from "./input/RC/655";
import { saveCookies } from "./cookies/cookies";
import { saveLocalStorage } from "./cookies/cookies";

const files = [a500, a555, a655];
const num = [500, 555, 655];

const getData = async (file: any[], num: number) => {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();

  // await loadCookies(page);
  // await loadLocalStorage(page);

  // Go to the login page (if not logged in)
  await page.goto("https://gmatclub.com/forum/ucp.php?mode=login", {
    waitUntil: "networkidle2",
  });

  const isLoggedIn = await page.evaluate(() => {
    return document.querySelector(".head-table") !== null;
  });

  if (!isLoggedIn) {
    console.log("Logging in...");
    // Perform login if not already logged in
    await page.type("#email", "phamvant"); // Replace with your email
    await page.type("#password", "thuan286"); // Replace with your password
    await Promise.all([
      page.click('input[type="submit"]'), // Adjust the selector for the submit button if needed
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // Save cookies and local storage after login
    await saveCookies(page);
    await saveLocalStorage(page);
  }

  console.log("Logged in");

  let ret = {};
  for (const val of file) {
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

          await new Promise((resolve) => setTimeout(resolve, 3000));
          if (data) {
            console.log(post);

            ret[val.topic].push({
              data: { ...data, type: "SC", range: num },
              link: post,
            });
            await writeFile(
              `./gmat/output/SC/data${num}.json`,
              JSON.stringify(ret, null, 2)
            );
          }
        }
      } catch (err) {
        console.error(err);
        console.error(post);
      }
    }
  }

  await browser.close();
};

const main = async () => {
  for (let i = 0; i < files.length; i++) {
    await getData(files[i], num[i]);
  }
};

main();
