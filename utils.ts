import { Pool } from "pg";

const pg = new Pool({
  user: "postgres",
  password: "thuan286",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

export async function getTags() {
  const tags = await pg.query("SELECT * FROM tags");
  return tags.rows;
}

export async function getSchools() {
  const schools = await pg.query("SELECT * FROM schools");
  return schools.rows;
}

export async function addTagIdToSchools() {
  const schools = await getSchools();
  const tags = await getTags();
  const client = await pg.connect();
  try {
    await client.query("BEGIN");

    for (const school of schools) {
      const tag = tags.find((tag) => tag.name === school.schoolname);
      if (tag) {
        await client.query(
          "UPDATE schools SET tag_id = $1 WHERE schoolcode = $2",
          [tag.id, school.schoolcode]
        );
        console.log("updated", school.schoolname);
      } else {
        throw new Error(`Tag not found for school ${school.schoolname}`);
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    console.log(e);
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

interface School {
  schoolcode: string;
  schoolname: string;
  nation: string;
  nation_id: string;
  tag_id: string;
}

// addTagIdToSchools();
export async function getSchoolsGroupByNationCode() {
  const schools = await getSchools();
  const schoolsGroupByNationCode = schools.reduce((acc, school) => {
    const nationCode = school.nationcode;
    if (!acc[nationCode]) {
      acc[nationCode] = [];
    }
    acc[nationCode].push(school);
    return acc;
  }, {});

  console.log(schoolsGroupByNationCode);
}

getSchoolsGroupByNationCode();
