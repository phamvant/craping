// university.interface.ts

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

export interface CSVData {
  uni_name: string;
  uni_cd_name: string;
  department_name: string;
  qs_world_rank: number | null;
  us_news_rank_world: number | null;
  us_rank: number | null;
  law_school_rank_us: number | null;
  business_school_rank_us: number | null;
  medicine_school_rank_us: number | null;
  gpa: number;
  gre: number;
  toefl: number;
  ielts: number | null;
  gmat: number | null;
  ctry_cd: string;
  number_of_applications: number;
  number_of_admissions: number;
}

export interface School {
  id: number;
  name: string;
  cd_name: string;
  logo: string;
  location: string;
  founded: number;
  nation: string;
  nationcode: string;
  type: "public" | "private";
  qs_world_rank: number;
  us_news_rank_world: number;
  us_rank: number;
  total_students: number;
  acceptance_rate: number;
  average_gpa: number;
  average_gre: number;
  average_toefl: number;
  number_of_applications: number;
  number_of_admissions: number;
  tuition: {
    in_state: number;
    out_state: number;
    international: number;
  };
  popular_majors: string[];
  campus_life?: {
    student_clubs: number;
    2;
    sports_teams: number;
    housing_options: string[];
  };
  description: string;
  website: string;
  admission_requirements?: {
    gpa: number;
    gre: number;
    toefl: number;
  };
  departments: SchoolDepartment[];
}

export interface SchoolDepartment {
  school_id: number;
  school_name: string;
  name: string;
  law_school_rank_us: number | null;
  business_school_rank_us: number | null;
  medicine_school_rank_us: number | null;
  engineer_school_rank_us: number | null;
  admission_requirements: {
    gpa: number;
    gre: number;
    toefl: number;
  };
  number_of_applications: number;
  number_of_admissions: number;
  description: string;
}

// read-csv.ts
import { readFileSync, writeFileSync } from "fs";
import { parse } from "csv-parse/sync";
import { readFile } from "fs/promises";

// Function to read and parse CSV file
export async function readCSV(filePath: string): Promise<CSVData[]> {
  try {
    // Read the CSV file
    const fileContent = await readFile(filePath, "utf-8");

    // Parse CSV content
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: (value, context) => {
        // Convert empty strings to null for numeric fields
        if (
          value === "" &&
          [
            "qs_world_rank",
            "us_news_rank_world",
            "us_rank",
            "law_school_rank_us",
            "business_school_rank_us",
            "medicine_school_rank_us",
            "gpa",
            "gre",
            "toefl",
            "ielts",
            "gmat",
            "number_of_applications",
            "number_of_admissions",
          ].includes(context.column as string)
        ) {
          return null;
        }
        // Convert numeric fields to numbers
        if (
          [
            "qs_world_rank",
            "us_news_rank_world",
            "us_rank",
            "law_school_rank_us",
            "business_school_rank_us",
            "medicine_school_rank_us",
            "gre",
            "toefl",
            "ielts",
            "gmat",
            "number_of_applications",
            "number_of_admissions",
          ].includes(context.column as string)
        ) {
          return value ? Number(value) : null;
        }
        // Convert gpa to number with proper decimal handling
        if (context.column === "gpa") {
          return value ? parseFloat(value.replace(",", ".")) : null;
        }
        return value;
      },
    });

    // Map records to University interface
    return records.map(
      (record: any): CSVData => ({
        uni_name: record.uni_name,
        uni_cd_name: record.uni_cd_name,
        department_name: record.department_name,
        qs_world_rank: record.qs_world_rank,
        us_news_rank_world: record.us_news_rank_world,
        us_rank: record.us_rank,
        law_school_rank_us: record.law_school_rank_us,
        business_school_rank_us: record.business_school_rank_us,
        medicine_school_rank_us: record.medicine_school_rank_us,
        gpa: record.gpa,
        gre: record.gre,
        toefl: record.toefl,
        ielts: record.ielts,
        gmat: record.gmat,
        ctry_cd: record.ctry_cd,
        number_of_applications: record.number_of_applications,
        number_of_admissions: record.number_of_admissions,
      })
    );
  } catch (error) {
    console.error("Error reading or parsing CSV:", error);
    throw new Error("Failed to process CSV file");
  }
}

// Function to filter universities by name
export function getUniversitiesByName(
  universities: CSVData[],
  name: string
): CSVData[] {
  return universities.filter((uni) =>
    uni.uni_name.toLowerCase().includes(name.toLowerCase())
  );
}

// Function to filter universities by department
export function getUniversitiesByDepartment(
  universities: CSVData[],
  department: string
): CSVData[] {
  return universities.filter((uni) =>
    uni.department_name.toLowerCase().includes(department.toLowerCase())
  );
}

function generateBatchRequestsGeneral(idx: number, uni: CSVData): BatchRequest {
  const batchRequest: BatchRequest = {
    custom_id: `${idx}`,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ${uni.uni_name} professor. You provide information about the university.`,
        },
        {
          role: "user",
          content: `
          Please provide information about the ${uni.uni_name} in the following json format:
            School {
              id: ${idx};
              name: ${uni.uni_name};
              cd_name: string;
              logo: string;
              location: string;
              founded: number;
              nation: string;
              nationcode: string;
              type: "public" | "private";
              qs_world_rank: number;
              us_news_rank_world: number;
              total_students: number;
              acceptance_rate: number;
              average_gpa: ${uni.gpa};
              average_gre: ${uni.gre};
              average_toefl: ${uni.toefl};
              number_of_applications: ${uni.number_of_applications};
              number_of_admissions: ${uni.number_of_admissions};
              tuition: {
                in_state: number;
                out_state: number;
                international: number;
              };
              popular_majors: string[];
              campus_life?: {
                student_clubs: number;
                sports_teams: number;
                housing_options: string[];
              };
              description: string;
              website: string;
            }

            with logo is image url. If any information is not available, set it to null.
            qs_world_rank is QS World University Rankings
            us_news_rank_world is US News & World Report
            nationcode in lowercase
          `,
        },
      ],
      response_format: { type: "json_object" },
    },
  };

  return batchRequest;
}
// Usage example
// try {
//   const universities = readCSV("./csv/schools.csv"); // Replace with your actual CSV file path|

//   let idx = 2;

//   let generalRequests: BatchRequest[] = [];

//   for (const uni of universities) {
//     if (uni.department_name === "General") {
//       generalRequests.push(generateBatchRequestsGeneral(idx, uni));
//     }
//     idx++;
//   }

//   const jsonlContent = generalRequests
//     .map((request) => JSON.stringify(request))
//     .join("\n");

//   writeFileSync("./csv/general.jsonl", jsonlContent);
// } catch (error) {
//   console.error("Error:", error);
// }

function generateBatchRequestsDepartment(
  idx: number,
  school_id: number,
  uni: CSVData
): BatchRequest {
  const batchRequest: BatchRequest = {
    custom_id: `${idx}`,
    method: "POST",
    url: "/v1/chat/completions",
    body: {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are ${uni.uni_name} professor. You provide information about the ${uni.department_name} department of the university.`,
        },
        {
          role: "user",
          content: `
          Please provide information about the ${uni.uni_name} in the following json format:
          SchoolDepartment {
            school_id: ${school_id};
            school_name: ${uni.uni_name};
            name: ${uni.department_name};
            law_school_rank_us: number;
            business_school_rank_us: number;
            medicine_school_rank_us: number;
            engineer_school_rank_us: number;
            admission_requirements: {
              gpa: number;
              gre: number;
              toefl: number;
            };
            number_of_applications: ${uni.number_of_applications};
            number_of_admissions: ${uni.number_of_admissions};
            description: string;
          }

          if department is business, find business_school_rank_us only,
          if department is law, find law_school_rank_us only,
          if department is medicine, find medicine_school_rank_us only,
          if department is engineer, find engineer_school_rank_us only
          `,
        },
      ],
      response_format: { type: "json_object" },
    },
  };

  return batchRequest;
}

// try {
//   const universities = readCSV("./csv/schools.csv"); // Replace with your actual CSV file path|

//   let idx = 2;
//   let idx2 = idx;

//   let departmentRequests: BatchRequest[] = [];

//   for (const uni of universities) {
//     if (uni.department_name === "General") {
//       idx2 = idx;
//       idx++;
//       continue;
//     }
//     departmentRequests.push(generateBatchRequestsDepartment(idx, idx2, uni));
//     idx++;
//   }

//   const jsonlContent = departmentRequests
//     .map((request) => JSON.stringify(request))
//     .join("\n");

//   writeFileSync("./csv/department.jsonl", jsonlContent);
// } catch (error) {
//   console.error("Error:", error);
// }
