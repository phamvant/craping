import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  const fileResponse = await openai.files.content(
    "file-4ypRaAyernkdKuG5mjUUAR"
  );
  const fileContents = await fileResponse.text();

  console.log(fileContents);

  // await fs.writeFile("batch_output.jsonl", fileContents);
};

main();
