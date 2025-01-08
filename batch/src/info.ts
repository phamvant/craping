import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const main = async () => {
  const batch = await openai.batches.retrieve(
    "batch_6772c5580560819094276ddb71a811d1"
  );
  console.log(batch);
};

main();
