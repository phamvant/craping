import puppeteer, { Page } from "puppeteer"; // or import puppeteer from 'puppeteer-core';
import { Worker } from "worker_threads";

var BASE_URL = "https://www.chasedream.com";
const CORE_NUM = 4;

export interface Category {
  url: string;
}

const chunkify = (categories: Category[], n: number) => {
  const chunks: Category[][] = [[], [], [], []];

  for (let i = 0; i < categories.length; i++) {
    chunks[i % n].push(categories[i]);
  }

  return chunks;
};

const chunkify2 = (total: number, n: number) => {
  const chunks: { start: number; stop: number }[] = [];
  const part = Math.floor(total / n);

  for (let i = 0; i < n; i++) {
    if (i === n - 1) {
      chunks.push({ start: i * part + 1, stop: total });
    } else {
      chunks.push({ start: i * part + 1, stop: (i + 1) * part });
    }
  }

  return chunks;
};

const getCategories = async (page: Page) => {
  return await page.evaluate((baseURL) => {
    const titleElements = document.querySelector(".sList");
    const list = titleElements?.querySelectorAll("li");
    return Array.from(list!).map((li) => {
      const a = li.querySelector("a");
      return {
        category: a!.innerText,
        url: baseURL + "/" + a!.getAttribute("href"),
      };
      // }
    });
  }, BASE_URL);
};

const all = async (idx: number) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/list.aspx?cid=${idx}`, {
    waitUntil: "networkidle2",
  });

  const categories = await getCategories(page);
  const chunks = chunkify(categories, CORE_NUM) as [];

  chunks.forEach((data: Category[], i: number) => {
    const worker = new Worker(require.resolve(`./worker`), {
      execArgv: ["-r", "ts-node/register/transpile-only"],
    });
    worker.postMessage(data);
    worker.on("message", () => {
      console.log(`Worker ${i} completed`);
    });
  });

  browser.close();
};

const single = async ({ idx, pages }: { idx: number; pages: number }) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/list.aspx?cid=${idx}`, {
    waitUntil: "networkidle2",
  });

  const chunks2 = chunkify2(pages, 4);
  chunks2.forEach((data, i) => {
    const worker = new Worker(require.resolve(`./worker`), {
      execArgv: ["-r", "ts-node/register/transpile-only"],
    });
    worker.postMessage({
      ...data,
      category: {
        url: `https://www.chasedream.com/list.aspx?cid=${idx}`,
      },
    });
    worker.on("message", () => {
      console.log(`Worker ${i} completed`);
    });
  });

  browser.close();
};

const test = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto("https://www.chasedream.com/show.aspx?id=35415&cid=22");

  const date = await page.evaluate(() => {
    const context = document.querySelector("#bodyTd");

    const date =
      context
        ?.querySelector("tr")
        ?.querySelector("td")
        ?.innerText.match(/\d{4}-\d{2}-\d{2}/)?.[0] || null;

    return date;
  });

  console.log(date);
};

single({ idx: 66, pages: 48 });
