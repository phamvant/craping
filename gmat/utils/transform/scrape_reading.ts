import { Page } from "puppeteer";
import { answerParse } from "./answer_parse_general";

interface Question {
  question: string;
  options: string[];
  answer: string;
}

export async function scrapeReading(
  page: Page,
  link: string
): Promise<{
  article: string;
  questions: Question[];
  explanation: string;
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

    const htmlContent = allItems[0].querySelectorAll(".bbcodeBoxIn")[0];

    if (!htmlContent) {
      return null;
    }

    let article = htmlContent.innerHTML.replace(/<br\s*\/?>/g, "\n").trim();

    const explainContent = allItems[1].innerHTML;

    const explanation = explainContent
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/&nbsp;/g, " ")
      .replace(
        /<span style="text-decoration: underline">(.*?)<\/span>/g,
        "<ins>$1</ins>"
      )
      .replace(/<(?!ins\b|\/?ins\b)[^>]*>/g, "")
      .trim();

    const questionHtml = allItems[0].querySelectorAll(".bbcodeBoxIn")[1];

    const isScrapeable = questionHtml.querySelector(
      'span[style="font-weight: bold"]'
    );

    let questions: string[] = [];

    questionHtml
      .querySelectorAll('span[style="font-weight: bold"]')
      .forEach((span) => {
        let current = span.nextSibling;
        let text = span.textContent?.trim() ?? "";
        while (current) {
          if (current.nodeType === Node.TEXT_NODE) {
            text += current.textContent?.trim();
          } else if (current.nodeName === "BR") {
            text += "\n";
          } else {
            if (text.length > 0) {
              questions.push(text);
              text = "";
            }
            break;
          }
          current = current.nextSibling;
        }
        if (text.length > 0) {
          questions.push(text);
        }
        text = "";
      });

    if (!isScrapeable) {
      return null;
    }

    const answerElement = document.querySelectorAll(".downRow");
    const answers: string[] = [];
    answerElement.forEach((element) => {
      const content = element.textContent?.trim();
      if (content && content.length < 3) {
        answers.push(content);
      }
    });

    return {
      article,
      explanation,
      questions,
      answers,
    };
  });

  let ret;

  if (data) {
    const retData: Question[] = data.questions.map((questions, idx) => {
      const { question, options } = answerParse(questions);
      return { question, options, answer: data.answers[idx] };
    });

    ret = {
      article: data.article,
      explanation: data.explanation,
      questions: retData,
    };
  }

  return ret;
}
