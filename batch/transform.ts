// Import necessary modules
import fs, { access } from "fs";
import path from "path";

// Input JSONL file
const inputJsonlFile = "batch_output.jsonl";
// Output directory for the HTML files
const outputHtmlDirectory = "translated_html_files";

// Ensure the output directory exists
if (!fs.existsSync(outputHtmlDirectory)) {
  fs.mkdirSync(outputHtmlDirectory, { recursive: true });
}

// Function to decode Unicode escape sequences
function decodeUnicode(str) {
  return str.replace(/\\u[\dA-F]{4}/gi, (match) => {
    return String.fromCharCode(parseInt(match.replace("\\u", ""), 16));
  });
}

// Read the JSONL file
fs.readFile(inputJsonlFile, "utf-8", (err, data) => {
  if (err) {
    console.error("Error reading the JSONL file:", err);
    return;
  }

  // Split the data into lines
  const lines = data.split("\n").filter((line) => line.trim() !== "");

  lines.forEach((line, index) => {
    try {
      // Parse the line as JSON
      const jsonResponse = JSON.parse(line);

      // Check if the response exists and contains content
      const assistantMessage =
        jsonResponse.response?.body?.choices?.[0]?.message?.content;

      if (assistantMessage) {
        // Extract HTML content from the code block
        const htmlMatch = assistantMessage.match(
          /```html\\n([\\s\\S]*?)\\n```/
        );

        let htmlContent = assistantMessage; // Extract HTML content

        // Decode Unicode escape sequences
        htmlContent = decodeUnicode(htmlContent);

        // Generate output HTML file name
        const outputFileName = path.join(
          outputHtmlDirectory,
          `translated_${index + 1}.html`
        );

        // Write the decoded HTML content to a file
        fs.writeFile(outputFileName, htmlContent, "utf-8", (err) => {
          if (err) {
            console.error(`Error writing to file ${outputFileName}:`, err);
          } else {
            console.log(`Created: ${outputFileName}`);
          }
        });
      }
    } catch (error) {
      console.error(`Error processing line ${index + 1}:`, error);
    }
  });
});
