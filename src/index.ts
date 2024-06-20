import puppeteer from "puppeteer"; // or import puppeteer from 'puppeteer-core';
import fs from "fs";

const main = async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate the page to a URL.
  await page.goto("https://www.chasedream.com/show.aspx?id=35378&cid=29", {
    waitUntil: "networkidle2",
  });

  const post = await page.evaluate(() => {
    const content = document.querySelector("#content");
    const title = document.querySelector(".aTitle");
    return { title: title?.innerHTML, content: content?.innerHTML };
  });

  fs.open("test.txt", "w", (err, fd) => {
    fs.writeFileSync(fd, "title: " + post.title!.toString());
    fs.writeFileSync(fd, "content: " + post.content!.toString());
    fs.close(fd);
  });

  browser.close();
};

main();
