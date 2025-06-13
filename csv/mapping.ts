import { readFile, writeFile } from "fs/promises";
import { School, SchoolDepartment } from ".";

const mapping = async () => {
  const departmentsFile = await readFile("./csv/xxx.json", "utf-8");
  const departmentsJson = JSON.parse(departmentsFile) as SchoolDepartment[];

  const schools = await readFile("./csv/xxx2.json", "utf-8");
  const schoolsJson = JSON.parse(schools) as School[];

  let idx = 0;
  for (const school of schoolsJson) {
    const departments = departmentsJson.filter(
      (department) => department.school_id === school.id
    );
    schoolsJson[idx].departments = departments;
    schoolsJson[idx].cd_name = school.cd_name;
    idx++;
  }

  await writeFile("./csv/xxx3.json", JSON.stringify(schoolsJson, null, 2));
};

mapping();
