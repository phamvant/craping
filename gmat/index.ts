import puppeteer from "puppeteer";
import { writeFile } from "fs/promises";
import {
  loadCookies,
  loadLocalStorage,
  saveCookies,
  saveLocalStorage,
  scrapeData,
} from "./GMAT";
import { a500 } from "./input/DS/500";

(async () => {
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

  // Check if logged in (by checking for a specific element)
  const isLoggedIn = await page.evaluate(() => {
    return !!document.querySelector("element-1"); // Adjust the selector based on your site
  });

  if (!isLoggedIn) {
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
          await new Promise((resolve) => setTimeout(resolve, 3000));
          if (data) {
            console.log(post);

            ret[val.topic].push({ data, link: post });
            await writeFile(
              "./gmat/output/DS/data500.json",
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
})();
