import { readFile, writeFile } from "fs/promises";
import { readCSV, School, SchoolDepartment } from ".";

const main = async () => {
  try {
    const universities = await readCSV("./csv/schools.csv"); // Replace with your actual CSV file path|
    const departmentsFile = await readFile(
      "./csv/final_results_department.json",
      "utf-8"
    );

    const departments = JSON.parse(departmentsFile) as SchoolDepartment[];

    let idx = 0;

    for (const uni of universities) {
      if (uni.department_name === "General") {
        continue;
      }
      departments[idx].admission_requirements.gpa = uni.gpa;
      departments[idx].admission_requirements.gre = uni.gre;
      departments[idx].admission_requirements.toefl = uni.toefl;
      departments[idx].number_of_admissions = uni.number_of_admissions;
      departments[idx].number_of_applications = uni.number_of_applications;
      idx++;
    }

    await writeFile("./csv/xxx.json", JSON.stringify(departments), "utf-8");
  } catch (error) {
    console.error("Error:", error);
  }
};

// main();

const main2 = async () => {
  try {
    const universities = await readCSV("./csv/schools.csv"); // Replace with your actual CSV file path|
    const schoolsFile = await readFile("./csv/final_results.json", "utf-8");

    const schools = JSON.parse(schoolsFile) as School[];

    let idx = 0;

    for (const uni of universities) {
      if (uni.department_name === "General") {
        schools[idx].admission_requirements = {
          gpa: uni.gpa,
          gre: uni.gre,
          toefl: uni.toefl,
        };
        schools[idx].cd_name = uni.uni_cd_name;
        idx++;
      }
    }

    await writeFile("./csv/xxx2.json", JSON.stringify(schools), "utf-8");
  } catch (error) {
    console.error("Error:", error);
  }
};

main2();
