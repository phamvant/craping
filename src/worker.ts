import fs from "fs/promises";
import path from "path";
import puppeteer, { Page } from "puppeteer"; // or import puppeteer from 'puppeteer-core';
import { parentPort } from "worker_threads";
import { Category } from "./index.js";

var BASE_URL = "https://www.chasedream.com";

const getTotalPageOfCategory = async (page: Page, category: Category) => {
  await page.goto(`${category.url}`);

  return await page.evaluate(() => {
    return Number(document.querySelector(".p_total")?.innerHTML.split("/")[1]);
  });
};

const getLinks = async (page: Page, category: Category, pageIdx: number) => {
  await page.goto(`${category.url.replace("cid", `page=${pageIdx}&cid`)}`);

  return await page.evaluate((baseUrl) => {
    const links = document.querySelectorAll(".title");

    return Array.from(links).map((link) => {
      const aTag = link.querySelector("a");
      return {
        title: aTag.innerText,
        url: baseUrl + "/" + aTag?.getAttribute("href"),
      };
    });
  }, BASE_URL);
};

const getContent = async (page: Page, link: { title: string; url: string }) => {
  await page.goto(link.url);

  return await page.evaluate(() => {
    return (
      document.querySelector(".aTitle")?.outerHTML +
      "\n" +
      document.querySelector("#content")?.outerHTML
    );
  });
};

parentPort.on("message", async (data: any) => {
  if (data.start) {
    signle(data);
  } else {
    all(data);
  }
});

const signle = async (data: {
  start: number;
  stop: number;
  category: Category;
}) => {
  const regex = /id=(\d+)/;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const resultDir = path.join("result", data.category.category);
  if (!fs.access(resultDir)) {
    fs.mkdir(resultDir, { recursive: true });
  }

  for (let pageIdx = data.start; pageIdx < data.stop + 1; pageIdx++) {
    const links = await getLinks(page, data.category, pageIdx);
    for (const link of links) {
      try {
        console.log("Pulling", link.title);
        const content = await getContent(page, link);
        const match = link.url.match(regex);
        const id = match ? match[1] : null;

        if (content) {
          fs.writeFile(path.join(resultDir, id + ".html"), content.toString());
        }
      } catch (e) {
        console.log(e);
      }
    }
  }
};

const all = async (categories: Category[]) => {
  const regex = /id=(\d+)/;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  for (const category of categories) {
    const resultDir = path.join("result", category.category);
    if (!fs.access(resultDir)) {
      fs.mkdir(resultDir, { recursive: true });
    }
    const total = await getTotalPageOfCategory(page, category);
    for (let pageIdx = 1; pageIdx < total + 1; pageIdx++) {
      const links = await getLinks(page, category, pageIdx);
      for (const link of links) {
        try {
          console.log("Pulling ", link.title);
          const content = await getContent(page, link);
          const match = link.url.match(regex);
          const id = match ? match[1] : null;
          if (content) {
            fs.writeFile(
              path.join(resultDir, id + ".html"),
              content.toString()
            );
          }
        } catch (e) {
          console.log(e);
        }
      }
    }
  }
  parentPort?.postMessage("done");
};
