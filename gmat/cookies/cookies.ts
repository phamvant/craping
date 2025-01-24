import { Page } from "puppeteer";
import * as fs from "fs";
export const cookiesFilePath = "./cookies/cookies.json";
export const localStorageFilePath = "./cookies/localStorage.json";

export async function saveCookies(page: Page) {
  const cookies = await page.cookies();
  fs.writeFileSync(cookiesFilePath, JSON.stringify(cookies));
}

export async function saveLocalStorage(page: Page) {
  const localStorageData = await page.evaluate(() =>
    JSON.stringify(window.localStorage)
  );
  fs.writeFileSync(localStorageFilePath, localStorageData);
}

export async function loadCookies(page: Page, fs: any) {
  if (fs.existsSync(cookiesFilePath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesFilePath, "utf-8"));
    await page.setCookie(...cookies);
  }
}

export async function loadLocalStorage(page: Page) {
  if (fs.existsSync(localStorageFilePath)) {
    const localStorageData = JSON.parse(
      fs.readFileSync(localStorageFilePath, "utf-8")
    );
    await page.evaluate((data) => {
      for (const key in data) {
        window.localStorage.setItem(key, data[key]);
      }
    }, localStorageData);
  }
}
