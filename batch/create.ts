import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  const batch = await openai.batches.create({
    input_file_id: "file-YRx9dG8LsHBeQVujq1sjt5",
    endpoint: "/v1/chat/completions",
    completion_window: "24h",
  });

  console.log(batch);
};

main();
