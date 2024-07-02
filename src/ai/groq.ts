import Groq from "groq-sdk";
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
  const content = (
    await fs.readFile("./result/MBA/MBA面试/000001.html")
  ).toString();
  const ret = await getGroqChatCompletion(content);

  console.log(ret.choices[0]?.message?.content || "");
  console.log(ret);
};

main();
