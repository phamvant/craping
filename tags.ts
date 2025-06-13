import * as fs from "fs/promises";

interface JsonItem {
  id: string;
  title: string;
  content: string;
}

interface BatchRequest {
  custom_id: string;
  method: string;
  url: string;
  body: {
    model: string;
    messages: { role: string; content: string }[];
    response_format: { type: string };
  };
}

interface Result {
  id: string;
  custom_id: string;
  response: {
    status_code: number;
    request_id: string;
    body: {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: {
        index: number;
        message: { role: string; content: string };
        finish_reason: string;
      }[];
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };
  };
}

async function generateBatchRequests(
  inputFile: string,
  outputFile: string
): Promise<void> {
  try {
    // Read and parse the input JSON file
    const rawData = await fs.readFile(inputFile, "utf-8");
    const jsonData: JsonItem[] = JSON.parse(rawData);

    // Array to store batch requests
    const requests: BatchRequest[] = [];

    // Iterate through each item in the JSON array
    jsonData.forEach((item) => {
      // Request for translating the title
      requests.push({
        custom_id: `${item.id}-title`,
        method: "POST",
        url: "/v1/chat/completions",
        body: {
          model: "gpt-4.1-mini",
          messages: [
            {
              role: "system",
              content: `You are University and Geopolitical Data Extractor`,
            },
            {
              role: "user",
              content: `
              Extract all school names in English only and their corresponding countries from the provided text. 
              Leveraging knowledge of higher education institutions and geopolitical entities. 
              Resolves abbreviations for schools (e.g., MIT to Massachusetts Institute of Technology) and countries (e.g., USA to United States)
              Return the results as a JSON array of objects under the key 'schools', 
              where each object contains 'school' and 'nation' fields. 
              For schools identified by abbreviations, return full name in the 'school' field. 
              For countries identified by abbreviations, use the full country name in the 'nation' field. 
              If a school is mentioned without an associated country, 
              research and assign the correct country to the 'nation' field. 
              If a country is mentioned without an associated school, set the 'school' field to 'Unknown'
              Text:
              ${item.title}

              ${item.content}
              `,
            },
          ],
          response_format: { type: "json_object" },
        },
      });
    });

    // Write requests to a JSONL file
    const jsonlContent = requests
      .map((request) => JSON.stringify(request))
      .join("\n");
    await fs.writeFile(outputFile, jsonlContent, "utf-8");

    console.log(`Batch request file '${outputFile}' created successfully.`);
  } catch (error) {
    console.error("Error generating batch requests:", error);
  }
}

interface ResultItem {
  schools: { school: string; nation: string }[];
}

async function parseResult(inputFile: string) {
  const rawData = await fs.readFile(inputFile, "utf-8");

  const jsonData: Result[] = JSON.parse(rawData);
  const schoolsSet: Record<string, Set<string>> = {};
  const nationSet: Record<string, Set<string>> = {};
  const finalResults: any = [];

  for (const result of jsonData) {
    const { custom_id, response } = result;
    let id: string;
    const { body } = response;
    const { choices } = body;
    const { message } = choices[0];

    if (custom_id.includes("title")) {
      id = custom_id.split("-title")[0];
    } else {
      id = custom_id.split("-content")[0];
    }

    const resultItem: ResultItem = JSON.parse(message.content);
    finalResults.push({
      id,
      schools: [...new Set(resultItem.schools.map((school) => school.school))],
      nations: [...new Set(resultItem.schools.map((school) => school.nation))],
    });

    for (const school of resultItem.schools) {
      if (schoolsSet[school.school]) {
        schoolsSet[school.school].add(school.nation);
      } else {
        schoolsSet[school.school] = new Set([school.nation]);
      }
    }

    for (const school of resultItem.schools) {
      if (nationSet[school.nation]) {
        nationSet[school.nation].add(school.school);
      } else {
        nationSet[school.nation] = new Set([school.school]);
      }
    }
  }
  const schoolsList = Object.entries(schoolsSet).map(([school, nations]) => ({
    school,
    nations: Array.from(nations),
  }));
  const nationsList = Object.entries(nationSet).map(([nation, schools]) => ({
    nation,
    schools: Array.from(schools),
  }));

  // await fs.writeFile("school_list.json", JSON.stringify(schoolsList), "utf-8");
  // await fs.writeFile("nation_list.json", JSON.stringify(nationsList), "utf-8");
  await fs.writeFile(
    "final_results.json",
    JSON.stringify(finalResults),
    "utf-8"
  );
}

generateBatchRequests("./xxx/posts.json", "./batch_requests2.jsonl");
// parseResult("./batch_results_tag.json");
