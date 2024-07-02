import puppeteer, { Page } from "puppeteer"; // or import puppeteer from 'puppeteer-core';
import { Worker } from "worker_threads";

var BASE_URL = "https://www.chasedream.com";
const CORE_NUM = 4;

export interface Category {
  category: string;
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
      // if (!a!.getAttribute("href").includes("21")) {
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

const single = async (idx: number) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(`${BASE_URL}/list.aspx?cid=${idx}`, {
    waitUntil: "networkidle2",
  });

  const chunks2 = chunkify2(26, 4);
  chunks2.forEach((data, i) => {
    const worker = new Worker(require.resolve(`./worker`), {
      execArgv: ["-r", "ts-node/register/transpile-only"],
    });
    worker.postMessage({
      ...data,
      category: {
        category: "MBA面试",
        url: "https://www.chasedream.com/list.aspx?cid=21",
      },
    });
    worker.on("message", () => {
      console.log(`Worker ${i} completed`);
    });
  });

  browser.close();
};

single(25);
