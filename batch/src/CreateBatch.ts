// Import necessary modules
const fs = require("fs");
const path = require("path");

// Directory containing HTML files
const htmlDirectory =
  "/Users/phamvant/Coding/JavaScript/dreamhacker/craping/data/cn/cn/14_cn";
// Output JSONL batch file
const outputFile = "batch_input.jsonl";

// Template for the OpenAI API request
const requestTemplate = {
  custom_id: "",
  method: "POST",
  url: "/v1/chat/completions",
  body: {
    model: "gpt-3.5-turbo-0125",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: `` },
    ],
    max_tokens: 1000,
  },
};

// Read the HTML directory
fs.readdir(htmlDirectory, (err, files) => {
  if (err) {
    console.error("Error reading the directory:", err);
    return;
  }

  // Filter and process HTML files
  const htmlFiles = files.filter((file) => file.endsWith(".html"));

  // Open a writable stream for JSONL output
  const writeStream = fs.createWriteStream(outputFile);

  htmlFiles.forEach((file, index) => {
    const filePath = path.join(htmlDirectory, file);

    // Read the content of the HTML file
    fs.readFile(filePath, "utf-8", (err, htmlContent) => {
      if (err) {
        console.error(`Error reading file ${file}:`, err);
        return;
      }

      // Wrap HTML content in a code block
      const wrappedContent = `\n\n\`\`\`html\n${htmlContent}\n\`\`\``;

      // Create a new request for each file
      const request = JSON.parse(JSON.stringify(requestTemplate)); // Deep copy the template
      request.custom_id = `request-${index + 1}`;
      request.body.messages[1].content = `Please translate the following HTML content to Vietnamese:${wrappedContent}`;

      // Write each request as a JSONL line
      writeStream.write(JSON.stringify(request) + "\n");

      // Log when all files are processed
      if (index === htmlFiles.length - 1) {
        writeStream.end(() => {
          console.log(`Batch input JSONL file created: ${outputFile}`);
        });
      }
    });
  });
});
