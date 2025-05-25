import { connect } from "puppeteer-real-browser";

import { readFile, writeFile } from "fs/promises";
import { a500 } from "./input/SC/500";
import { a505 } from "./input/SC/505";
import { a555 } from "./input/SC/555";
import { a605 } from "./input/SC/605";
import { a655 } from "./input/SC/655";
import { a705 } from "./input/SC/705";
import { a805 } from "./input/SC/805";
import {
  cookiesFilePath,
  loadCookies,
  loadLocalStorage,
  saveCookies,
} from "./cookies/cookies";
import { scrapeGeneral } from "./utils/transform/scrape_general";
import fs from "fs";

const StealthPlugin = require("puppeteer-extra-plugin-stealth");

const files = [a500, a505, a555, a605, a655, a705, a805];
const nums = [500, 505, 555, 605, 655, 705, 805];

const getData = async (file: any[], num: number) => {
  const { page } = await connect({
    headless: false,
    // fingerprint: true,
    turnstile: true,
    // tf: true,
  });

  // if (fs.existsSync("./gmat/cookies/cookies.json")) {
  //   const cookies = JSON.parse(
  //     fs.readFileSync("./gmat/cookies/cookies.json", "utf-8")
  //   );
  //   await browser.setCookie(...cookies);
  // }

  // await loadCookies(browser);
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
    // await saveCookies(page);
    // await saveLocalStorage(page);
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
          console.log(post);
          const data = await scrapeGeneral(page, post);

          await new Promise((resolve) => setTimeout(resolve, 3000));
          if (data) {
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
};

const fixQuestion = async () => {
  const { page } = await connect({
    headless: false,
  });

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
    // await saveCookies(page);
    // await saveLocalStorage(page);
  }

  console.log("Logged in");

  for (let i = 0; i <= nums.length; i++) {
    let count = 0;
    const data = await readFile(`./gmat/output/SC/data${nums[i]}.json`, "utf8");
    let jsonData = JSON.parse(data);
    let writeData = {};

    const keys = Object.keys(jsonData);
    for (const key of keys) {
      writeData[key] = [];
      const questions = jsonData[key];
      for (let j = 0; j < questions.length; j++) {
        const question = questions[j];
        if (question.data.question === undefined) {
          try {
            const data = await scrapeGeneral(page, question.link);
            if (data) {
              writeData[key].push({
                data: { ...data, type: "SC", range: nums[i] },
                link: question.link,
              });
              count++;
              console.log("Scrape question: " + question.link + " " + count);
              console.log(writeData[key][j].data);
              await new Promise((resolve) => setTimeout(resolve, 3000));
            } else {
              throw new Error("Error scrape question: " + question.link);
            }
          } catch (err) {
            writeData[key].push(question);
            console.error(err);
          }
        } else {
          writeData[key].push(question);
        }
      }
    }

    await writeFile(
      `./gmat/output/SC/data${nums[i]}.json`,
      JSON.stringify(writeData, null, 2)
    );

    console.log("Scrape " + count + " questions");
    console.log("Write file " + nums[i]);
  }
};

const main = async () => {
  for (let i = 0; i < files.length; i++) {
    await getData(files[i], nums[i]);
  }
};

main();
