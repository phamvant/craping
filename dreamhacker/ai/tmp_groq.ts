import { readFile, writeFile, readdir } from "fs/promises";
import { encoding_for_model } from "@dqbd/tiktoken";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: "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",
});
const TOKEN_LIMIT = 30000; // Limit of tokens per minute

async function getGroqChatCompletion(prop, lang) {
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: `
        ${prop}

        just translate to ${lang} without change html format. You don't have to explain anything
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



      just translate to English without change html format. You don't have to explain anything
  `
  );
  encoder.free();
  return tokens.length;
}

const translatePosts = async (category: number) => {
  let i = 0;
  let tokensUsed = 0;
  const posts = await readdir(`./data/en/${category}_en`);

  const resetTokens = () => {
    tokensUsed = 0;
  };

  setInterval(resetTokens, 60000); // Reset the token count every minute

  const getData = async () => {
    const content = (
      await readFile(`./data/en/${category}_en/${posts[i]}`)
    ).toString();
    const tokens = numTokensFromString(content);
    console.log(posts[i]);
    console.log(content);

    if (tokensUsed + tokens > TOKEN_LIMIT) {
      while (!tokensUsed) {}
    }

    if (tokens > 8000) {
      // If the content is too large or we exceed the token limit, skip to the next file
      i++;
      return true;
    }

    tokensUsed += tokens;

    const ret = await getGroqChatCompletion(content, "Vietnamese");

    await writeFile(`./data/vn/${category}_vn/${posts[i]}`, ret || "null");

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

export async function translate(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (!text) return "";

  try {
    // Map target language codes to full names for the prompt
    const languageMap: { [key: string]: string } = {
      zh: "Chinese",
      vi: "Vietnamese",
      en: "English",
    };

    const targetLanguageName = languageMap[targetLanguage] || targetLanguage;

    // Create a prompt for translation
    const prompt = `Translate the following text to ${targetLanguageName}: "${text}"`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: "llama3-70b-8192", // Use the available Groq model (e.g., grok-beta)
      messages: [
        {
          role: "system",
          content:
            "You are a professional translator. Provide accurate and natural translations. Just return the translation, no other text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 2000, // Adjust based on expected response length
      temperature: 0.7, // Adjust for creativity vs. accuracy
    });

    // Extract the translated text
    const translatedText = completion.choices[0]?.message?.content?.trim();
    if (!translatedText) {
      throw new Error("No translation returned from Groq API");
    }

    return translatedText;
  } catch (error) {
    console.error("Error translating text with Groq API:", error);
    throw new Error(`Translation failed: ${error}`);
  }
}
