import { translate } from "../ai/tmp_groq";
import { query } from "../postgres";

export type MultilingualContent = {
  en: string;
  zh?: string;
  vi?: string;
};

export type Post = {
  id: string;
  title: MultilingualContent;
  content: MultilingualContent;
  excerpt?: MultilingualContent;
  user_id: string;
  category_id?: string | null;
  image_url?: string | null;
  original_link?: string | null;
  is_pinned?: boolean;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  author?: {
    id: string;
    name: string;
    username: string;
    image_url?: string;
  };
  category?: {
    id: string;
    name: MultilingualContent;
  };
  likes_count?: number;
  comments_count?: number;
  liked?: boolean;
  saved?: boolean;
  is_featured?: boolean;
  view_count?: number;
  user?: {
    id: string;
    name: string;
    username: string;
    image_url?: string;
  };
};

async function translateText(
  text: string,
  targetLang: string
): Promise<string> {
  try {
    const translatedText = await translate(text, targetLang);

    return translatedText.replace(/^"|"$/g, "");
  } catch (error) {
    console.error("Translation error:", error);
    throw error;
  }
}

async function updatePostTitle(postId: string, title: any): Promise<void> {
  try {
    const sql = `
      UPDATE posts 
      SET title = $1, updated_at = $2
      WHERE id = $3
    `;

    await query(sql, [JSON.stringify(title), new Date().toISOString(), postId]);
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

async function fixNullTitles() {
  try {
    // Get all posts with null titles
    const sql = `
      SELECT * FROM posts 
      WHERE length(title->>'en') = 0
      OR length(title->>'zh') = 0
      OR length(title->>'vi') = 0
      ORDER BY created_at DESC
    `;

    const posts = await query<Post>(sql);
    console.log(`Found ${posts.length} posts with null titles`);

    let requestCount = 0;
    const RATE_LIMIT = 30;
    const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

    const resetRequestCount = () => {
      requestCount = 0;
    };

    // Reset request count every minute
    setInterval(resetRequestCount, RATE_LIMIT_WINDOW);

    for (const post of posts) {
      console.log(`Processing post ${post.id}...`);
      const title = post.title as any;
      let needsUpdate = false;

      // Check English title
      if (!title.en || title.en.trim() === "") {
        if (title.zh && requestCount < RATE_LIMIT) {
          console.log(
            `Translating English title from Chinese for post ${post.id}`
          );
          title.en = await translateText(title.zh, "en");
          requestCount++;
          needsUpdate = true;
        }
      }

      // Check Vietnamese title
      if (!title.vi || title.vi.trim() === "") {
        if (title.en && requestCount < RATE_LIMIT) {
          console.log(
            `Translating Vietnamese title from English for post ${post.id}`
          );
          title.vi = await translateText(title.en, "vi");
          requestCount++;
          needsUpdate = true;
        }
      }

      // Check Chinese title
      if (!title.zh || title.zh.trim() === "") {
        console.log(`Post ${post.id} has no Chinese title`);
        continue;
      }

      if (needsUpdate) {
        console.log(`Updating post ${post.id} with new titles:`, title);
        await updatePostTitle(post.id, title);
      }

      // If we've hit the rate limit, wait until the next minute
      if (requestCount >= RATE_LIMIT) {
        console.log("Rate limit reached, waiting for next window...");
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_WINDOW));
        requestCount = 0;
      }
    }

    console.log("Finished processing all posts");
  } catch (error) {
    console.error("Error in fixNullTitles:", error);
  }
}

// Run the script
fixNullTitles().catch(console.error);
