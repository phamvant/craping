import puppeteer from "puppeteer";
import {
  loadCookies,
  loadLocalStorage,
  saveCookies,
  saveLocalStorage,
} from "./GMAT";

const cookiesFilePath = "./cookies.json";
const localStorageFilePath = "./localStorage.json";

async function scrapeData(link: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // // Load saved cookies and local storage if they exist
  await loadCookies(page);
  await loadLocalStorage(page);

  //   Go to the login page (if not logged in)
  await page.goto("https://gmatclub.com/forum/ucp.php?mode=login", {
    waitUntil: "networkidle2",
  });

  // Check if logged in (by checking for a specific element)
  const isLoggedIn = await page.evaluate(() => {
    return !!document.querySelector("element-2"); // Adjust the selector based on your site
  });

  if (!isLoggedIn) {
    // Perform login if not already logged in
    await page.type("#email", "phamvant"); // Replace with your email
    await page.type("#password", "thuan285"); // Replace with your password
    await Promise.all([
      page.click('input[type="submit"]'), // Adjust the selector for the submit button if needed
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    // Save cookies and local storage after login
    await saveCookies(page);
    await saveLocalStorage(page);
  }

  await page.goto(link, {
    waitUntil: "networkidle0",
  });

  const data = await page.evaluate(() => {
    const allItems = document.querySelectorAll(".item.text");

    const htmlContent = allItems[0].innerHTML;

    if (!htmlContent) {
      return null;
    }

    const explainContent = allItems[1].innerHTML;

    allItems[1].querySelector("");

    const question = htmlContent
      .split(`<div class="item twoRowsBlock">`)[0]
      // .replace(/<br\s*\/?>/g, "\n")
      .replace(/&nbsp;/g, " ")
      // .replace(/<[^>]+>.*?<\/[^>]+>/gs, "")
      .trim();

    const explanation = explainContent
      .split(`<div class="item twoRowsBlock">`)[0]
      // .replace(/<br\s*\/?>/g, "\n")
      .replace(/&nbsp;/g, " ")
      // .replace(/<[^>]+>.*?<\/[^>]+>/gs, "")
      .trim();

    const answerElement = document.querySelector(".downRow");

    if (!answerElement || !answerElement.textContent) {
      return null;
    }

    const answer = answerElement ? answerElement.textContent.trim() : "";

    return {
      question,
      answer,
      explanation,
    };
  });

  console.log(data);

  return data;
}

scrapeData("").catch((err) => console.error("Error:", err));
