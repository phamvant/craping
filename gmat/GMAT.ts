import * as fs from "fs";
import { Page } from "puppeteer";

const cookiesFilePath = "./cookies.json";
const localStorageFilePath = "./localStorage.json";

export async function saveCookies(page: Page) {
  const cookies = await page.cookies();
  fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies));
}

export async function saveLocalStorage(page: Page) {
  const localStorageData = await page.evaluate(() =>
    JSON.stringify(window.localStorage),
  );
  fs.writeFileSync(localStorageFilePath, localStorageData);
}

export async function loadCookies(page: Page) {
  if (fs.existsSync(cookiesFilePath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFilePath, "utf-8"));
    await page.setCookie(...cookies);
  }
}

export async function loadLocalStorage(page: Page) {
  if (fs.existsSync(localStorageFilePath)) {
    const localStorageData = JSON.parse(
      fs.readFileSync(localStorageFilePath, "utf-8"),
    );
    await page.evaluate((data) => {
      for (const key in data) {
        window.localStorage.setItem(key, data[key]);
      }
    }, localStorageData);
  }
}

//--------------------------------------------------------------------------------

export async function scrapeData(
  page: Page,
  link: string,
): Promise<{ question: string; answer: string } | null> {
  // const browser = await puppeteer.launch({ headless: true });
  // const page = await browser.newPage();

  // // Load saved cookies and local storage if they exist
  // await loadCookies(page);
  // await loadLocalStorage(page);

  // Go to the login page (if not logged in)
  // await page.goto("https://gmatclub.com/forum/ucp.php?mode=login", {
  //   waitUntil: "networkidle2",
  // });

  // // Check if logged in (by checking for a specific element)
  // const isLoggedIn = await page.evaluate(() => {
  //   return !!document.querySelector("element-1"); // Adjust the selector based on your site
  // });

  // if (!isLoggedIn) {
  //   // Perform login if not already logged in
  //   await page.type("#email", "phamvant"); // Replace with your email
  //   await page.type("#password", "thuan286"); // Replace with your password
  //   await Promise.all([
  //     page.click('input[type="submit"]'), // Adjust the selector for the submit button if needed
  //     page.waitForNavigation({ waitUntil: "networkidle2" }),
  //   ]);

  //   // Save cookies and local storage after login
  //   await saveCookies(page);
  //   await saveLocalStorage(page);
  // }

  await page.goto(link, {
    waitUntil: "networkidle2",
  });

  const data = await page.evaluate(() => {
    const htmlContent = document.querySelector(".item.text")?.innerHTML;

    if (!htmlContent) {
      return null;
    }

    let question = htmlContent
      .split(`<div class="item twoRowsBlock">`)[0]
      .replace(/<br\s*\/?>/g, "\n")
      .trim()
      .replace(/&nbsp;/g, " ")
      .trim()
      .replace(/<[^>]+>.*?<\/[^>]+>/gs, "")
      .trim();

    const answerElement = document.querySelector(".downRow");

    if (!answerElement || !answerElement.textContent) {
      return null;
    }

    const answer = answerElement ? answerElement.textContent.trim() : "";

    return {
      question,
      answer,
    };
  });

  return data;
}

// scrapeData().catch((err) => console.error("Error:", err));
