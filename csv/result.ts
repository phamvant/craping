import fs from "fs/promises";
import { School, SchoolDepartment } from ".";

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

async function parseResultSchool(inputFile: string) {
  const rawData = await fs.readFile(inputFile, "utf-8");

  const jsonData: Result[] = JSON.parse(rawData);

  let schoolsList: School[] = [];

  for (const item of jsonData) {
    const school = JSON.parse(
      item.response.body.choices[0].message.content
    ).School;
    schoolsList.push(school);
  }

  await fs.writeFile(
    "./csv/final_results.json",
    JSON.stringify(schoolsList),
    "utf-8"
  );

  console.log("Done");
}

async function parseResultDepartment(inputFile: string) {
  const rawData = await fs.readFile(inputFile, "utf-8");

  const jsonData: Result[] = JSON.parse(rawData);

  let departments: SchoolDepartment[] = [];

  for (const item of jsonData) {
    const department = JSON.parse(
      item.response.body.choices[0].message.content
    );

    if (department.SchoolDepartment) {
      departments.push(department.SchoolDepartment);
    } else {
      departments.push(department);
      console.log(department);
      console.log("Error");
    }
  }

  await fs.writeFile(
    "./csv/final_results_department.json",
    JSON.stringify(departments),
    "utf-8"
  );

  console.log("Done");
}

parseResultDepartment("./csv/department_result.json");
// parseResult("./csv/result2.json");
