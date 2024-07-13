import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "http://localhost:1234/v1",
  apiKey: "lm-studio", // This is the default and can be omitted
});

async function main() {
  const chatCompletion = await openai.chat.completions.create({
    messages: [{ role: "user", content: "Say this is a test" }],
    model: "lmstudio-community/Meta-Llama-3-8B-Instruct-GGUF",
  });

  console.log(chatCompletion.choices[0].message);
}

main();
