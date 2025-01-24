import { Page } from "puppeteer";
import { answerParse } from "./answer_parse_general";

export async function scrapeData(
  page: Page,
  link: string
): Promise<{
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  imgUrl?: string;
  // link: string;
} | null> {
  await page.goto(link, {
    waitUntil: "networkidle2",
  });

  const data = await page.evaluate(() => {
    // document.querySelectorAll("span")?.forEach((span) => span.remove());
    document.querySelectorAll("script").forEach((script) => {
      const textContent = script.textContent || "";
      script.replaceWith(textContent);
    });
    document.querySelectorAll(".quotetitle").forEach((title) => {
      title.remove();
    });
    document.querySelectorAll(".quotecontent").forEach((content) => {
      content.remove();
    });
    const allItems = document.querySelectorAll(".item.text");

    const htmlContent = allItems[0].innerHTML;

    if (!htmlContent) {
      return null;
    }

    const explainContent = allItems[1].innerHTML;

    let question = htmlContent
      .split(`<div class="item twoRowsBlock">`)[0]
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(
        /<span style="text-decoration: underline">(.*?)<\/span>/g,
        "<ins>$1</ins>"
      )
      .replace(/<(?!ins\b|\/?ins\b)[^>]*>/g, "")
      .trim();

    const imgMatch = question.match(/<img[^>]+src="([^">]+)"/);
    const imgUrl = imgMatch ? imgMatch[1] : null;

    question = question.replace(/<img[^>]*>/g, "").trim();

    const explanation = explainContent
      .split(`<div class="item twoRowsBlock">`)[0]
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(
        /<span style="text-decoration: underline">(.*?)<\/span>/g,
        "<ins>$1</ins>"
      )
      .replace(/<(?!ins\b|\/?ins\b)[^>]*>/g, "")
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
      imgUrl,
    };
  });

  let ret;
  if (data) {
    const { question, options } = answerParse(data.question);

    ret = { ...data, question: question, options, imgUrl: data.imgUrl };
  }

  return ret;
}
