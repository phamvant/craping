import * as fs from "fs/promises";

// Function to check if a character is Chinese (Unicode range for CJK characters)
function isChineseChar(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (!codePoint) return false;

  // Common Chinese character Unicode ranges
  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK Unified Ideographs
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK Extension A
    (codePoint >= 0x20000 && codePoint <= 0x2a6df) || // CJK Extension B
    (codePoint >= 0x2a700 && codePoint <= 0x2b73f) || // CJK Extension C
    (codePoint >= 0x2b740 && codePoint <= 0x2b81f) || // CJK Extension D
    (codePoint >= 0x2b820 && codePoint <= 0x2ceaf) || // CJK Extension E
    (codePoint >= 0x2ceb0 && codePoint <= 0x2ebef) || // CJK Extension F
    (codePoint >= 0x30000 && codePoint <= 0x3134f) // CJK Extension G
  );
}

// Function to remove Chinese characters from text
function removeChineseChars(text: string): string {
  return Array.from(text)
    .filter((char) => !isChineseChar(char))
    .join("");
}

// Main function to process the file
async function processFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  try {
    // Read the input file
    const content = await fs.readFile(inputPath, "utf8");

    // Remove Chinese characters
    const cleanedContent = removeChineseChars(content);

    // Write to output file
    await fs.writeFile(outputPath, cleanedContent, "utf8");

    console.log(`Successfully processed file. Output saved to ${outputPath}`);
  } catch (error) {
    console.error("Error processing file:", error);
  }
}

// Usage example
async function main() {
  await processFile("nation_list.json", "nation_list_cleaned.json");
}

main();
