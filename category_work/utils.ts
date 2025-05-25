import { OpenAI } from "openai";
import { Post, ProcessedResult, SchoolNationPair } from "./types";

const DEEPSEEK_API_KEY = "sk-6561004907a74132aa9e8bf5d2a13343";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Initialize OpenAI client for DeepSeek
const openai = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: DEEPSEEK_API_URL,
});

/**
 * Clean the input text by removing excessive whitespace and special characters.
 */
export function cleanText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/**
 * Call the DeepSeek API with retry mechanism
 */
export async function callDeepSeekApi(
  text: string,
  retries = MAX_RETRIES
): Promise<{ schools: SchoolNationPair[] } | null> {
  try {
    const prompt = `
Extract all school names and their corresponding countries from the following text. 
Return the results as a JSON array of objects key in 'schools', each with 'school' and 'nation' fields.
If school name is abbreviations, find the full name of the school and response with format '(abbreviations) full name'.
If country name is abbreviations, find the full name of the country.
If a school is mentioned but no country is associated, find the country, set 'nation' to the country.
If a country is mentioned but no schools are associated, set 'school' to 'Unknown'.
Text:
${text}
`;

    const response = await openai.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result || null;
  } catch (error) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return callDeepSeekApi(text, retries - 1);
    }
    console.error("DeepSeek API request failed:", error);
    return null;
  }
}

/**
 * Process a single post with error handling
 */
export async function processPost(post: Post): Promise<ProcessedResult | null> {
  try {
    console.log("Processing post", post.id);
    const cleanedText = cleanText(post.content.en);
    const ret = await callDeepSeekApi(cleanedText);

    if (!ret) return null;

    return {
      postId: post.id,
      schools: ret.schools.map((item) => item.school),
      nations: Array.from(new Set(ret.schools.map((item) => item.nation))),
    };
  } catch (error) {
    console.error(`Error processing post ${post.id}:`, error);
    return null;
  }
}

/**
 * Update shared data structures atomically
 */
export async function updateSharedData(
  result: ProcessedResult,
  schoolsMap: Map<string, string>,
  nationMap: Map<string, string[]>
): Promise<void> {
  result.schools.forEach((school, index) => {
    const nation = result.nations[index];
    if (nation) {
      nationMap.set(nation, [...(nationMap.get(nation) || []), school]);
      schoolsMap.set(school, nation);
    }
  });
}
