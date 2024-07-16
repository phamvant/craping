import { readFile, writeFile } from "fs/promises";
// import OpenAI from "openai";

import { LMStudioClient } from "@lmstudio/sdk";

const client = new LMStudioClient();

// const openai = new OpenAI({
//   baseURL: "http://localhost:1234/v1",
//   apiKey: "lm-studio", // This is the default and can be omitted
// });

// export async function callAI(prop) {
//   const chatCompletion = await getGroqChatCompletion(prop);
//   return chatCompletion.choices[0]?.message?.content || "";
// }

async function getGroqChatCompletion(prop) {
  const modelPath = "bartowski/Starling-LM-7B-beta-GGUF";
  const llama3 = await client.llm.load(modelPath, {
    config: { gpuOffload: "max" },
  });

  const prediction = llama3.respond([{ role: "user", content: prop }]);

  return prediction;
}

const main = async () => {
  let i = 0;
  const file = await readFile("contents.json");
  const posts = JSON.parse(file.toString())["posts"] as string[];
  let totalTokenPerMinues = 0;

  const getData = async () => {
    console.log(posts[i]);
    const content = (await readFile(`./result/${posts[i]}`)).toString();

    const ret = await getGroqChatCompletion(
      content +
        `



      translate to English in markdown.'
      `,
    );

    // console.log(ret.content);

    writeFile(
      `./markdown/${posts[i].toString().split("/")[2].replace("html", "md")}`,
      ret.content || "null",
    );
    // totalTokenPerMinues += ret.usage.total_tokens;

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
