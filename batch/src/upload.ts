import fs from "fs";
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  const file = await openai.files.create({
    file: fs.createReadStream("batch_input.jsonl"),
    purpose: "batch",
  });

  console.log(file);
};

main();
