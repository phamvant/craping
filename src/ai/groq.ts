import { readFile, writeFile } from "fs/promises";

import { LMStudioClient } from "@lmstudio/sdk";

import { encoding_for_model } from "@dqbd/tiktoken";
const client = new LMStudioClient();

export async function callAI(prop) {
  const chatCompletion = await getGroqChatCompletion(prop);
  return chatCompletion.content;
}

async function getGroqChatCompletion(prop) {
  const modelPath = "bartowski/Starling-LM-7B-beta-GGUF";
  const llama3 = await client.llm.load(modelPath, {
    config: { gpuOffload: "max" },
  });

  const prediction = llama3.respond([{ role: "user", content: prop }]);

  return prediction;
}

function numTokensFromString(message: string) {
  const encoder = encoding_for_model("gpt-3.5-turbo");

  const tokens = encoder.encode(
    message +
      `



  translate to English in markdown
  `
  );
  encoder.free();
  return tokens.length;
}

const main = async () => {
  let i = 0;
  const file = await readFile("contents.json");
  const posts = JSON.parse(file.toString())["posts"] as string[];

  const getData = async () => {
    const content = (await readFile(`./result/${posts[i]}`)).toString();
    if (numTokensFromString(content) > 8000) {
      i++;
      return true;
    }

    const ret = await getGroqChatCompletion(content);

    writeFile(
      `./markdown/${posts[i].toString().split("/")[2].replace("html", "md")}`,
      ret.content || "null"
    );

    if (i < posts.length) {
      i++;
      return true;
    } else {
      false;
    }
  };

  while (1) {
    if (!(await getData())) {
      process.exit(0);
    }
  }
};

main();
