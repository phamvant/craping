import { readFile, writeFile } from "fs/promises";
import { encoding_for_model } from "@dqbd/tiktoken";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TOKEN_LIMIT = 30000; // Limit of tokens per minute

async function getGroqChatCompletion(prop) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `
        ${prop}

        just translate to English without change html format. You don't have to explain anything
      `,
      },
    ],
    model: "llama3-8b-8192",
  });

  return chatCompletion.choices[0].message.content;
}

function numTokensFromString(message) {
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
  let tokensUsed = 0;
  const file = await readFile("contents.json");
  const posts = JSON.parse(file.toString())["posts"] as string[];

  const resetTokens = () => {
    tokensUsed = 0;
  };

  setInterval(resetTokens, 60000); // Reset the token count every minute

  const getData = async () => {
    const content = (await readFile(`./result/${posts[i]}`)).toString();
    const tokens = numTokensFromString(content);

    if (tokensUsed + tokens > TOKEN_LIMIT) {
      while (!tokensUsed) {}
    }

    if (tokens > 8000) {
      // If the content is too large or we exceed the token limit, skip to the next file
      i++;
      return true;
    }

    tokensUsed += tokens;

    const ret = await getGroqChatCompletion(content);

    await writeFile(
      `./markdown/${posts[i].toString().split("/")[2]}`,
      ret || "null"
    );

    if (i < posts.length) {
      i++;
      return true;
    } else {
      return false;
    }
  };

  while (1) {
    if (!(await getData())) {
      process.exit(0);
    }
  }
};

main();
