import Groq from "groq-sdk";
import fsSync from "fs";
import fs from "fs/promises";

const groq = new Groq({
  apiKey: process.env.AI_APIKEY,
});

export async function callAI(prop) {
  const chatCompletion = await getGroqChatCompletion(prop);
  return chatCompletion.choices[0]?.message?.content || "";
}

async function getGroqChatCompletion(prop) {
  return groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You're helpful AI, I sent your artical as html, you will write summary in markdown in English",
      },
      {
        role: "user",
        content: prop,
      },
    ],
    model: "llama3-8b-8192",
  });
}

const main = async () => {
  let i = 0;
  const file = fsSync.readFileSync("contents.json");
  const posts = JSON.parse(file.toString())["posts"] as string[];
  let totalTokenPerMinues = 0;

  const getData = async () => {
    console.log(posts[i]);
    const content = (await fs.readFile(`./result/${posts[i]}`)).toString();

    const ret = await getGroqChatCompletion(content);

    fs.writeFile(
      `./markdown/${posts[i].toString().split("/")[2].replace("html", "md")}`,
      ret.choices[0]?.message?.content || "null"
    );
    totalTokenPerMinues += ret.usage.total_tokens;

    if (i < posts.length) {
      i++;
      return true;
    } else {
      false;
    }
  };

  let isPending = false;
  let pending;

  while (1) {
    if (isPending) {
      while (new Date().getMinutes() - pending === 0) {}
      isPending = false;
    }

    if (!(await getData())) {
      return;
    }

    if (14400 - totalTokenPerMinues < 7000) {
      isPending = true;
      pending = new Date().getMinutes();
    }
  }
};

main();
// const main = async () => {
//   const content = (
//     await fs.readFile("./result/MBA/MBA面试/000001.html")
//   ).toString();
//   const ret = await getGroqChatCompletion(content);

//   console.log(ret.choices[0]?.message?.content || "");
//   console.log(ret);
// };

// main();
