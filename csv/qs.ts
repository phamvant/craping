import { readFile, writeFile } from "fs/promises";
import { Pool } from "pg";

// Define an interface for the university data
interface University {
  rank: string;
  name: string;
}

// Function to parse CSV string
function parseCSV(csv: string): University[] {
  const lines = csv.trim().split("\n");
  const result: University[] = [];

  // Skip header row and parse each line
  for (let i = 1; i < lines.length; i++) {
    const [rank, name] = lines[i].split(",").map((item) => item.trim());
    result.push({
      rank: rank,
      name,
    });
  }

  return result;
}

const pg = new Pool({
  user: "postgres",
  host: "localhost",
  database: "bak",
  password: "thuan286",
  port: 5432,
});

const main = async () => {
  const client = await pg.connect();
  // Parse the CSV data
  const csvData = await readFile("./csv/test.csv", "utf-8");
  const universities = parseCSV(csvData).map((university) => ({
    name: university.name.split(" (")[0].trim(),
    qs_world_rank: university.rank,
  }));

  console.log(universities);

  const existingSchools = (await client.query(
    "SELECT id, name FROM schools"
  )) as { rows: { id: string; name: string }[] };

  const updated: string[] = [];
  const notUpdated: { name: string; rank: string }[] = [];
  let updatedCount = 0;
  let notUpdatedCount = 0;

  const transaction = await client.query("BEGIN");

  try {
    for (const university of universities) {
      const existingSchool = existingSchools.rows.find(
        (s: { id: string; name: string }) =>
          s.name.toLowerCase() === university.name.toLowerCase()
      );

      if (existingSchool) {
        // await client.query(
        //   "UPDATE schools SET qs_world_rank = $1 WHERE id = $2",
        //   [university.qs_world_rank, existingSchool.id]
        // );
        updated.push(university.name);
        updatedCount++;
      } else {
        notUpdated.push({
          name: university.name,
          rank: university.qs_world_rank,
        });
        notUpdatedCount++;
      }
    }
    await client.query("COMMIT");
    console.log(`Not updated schools: ${notUpdated.length}`);
    await writeFile(
      "./csv/not_updated.json",
      JSON.stringify(notUpdated, null, 2)
    );
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.query("COMMIT");
  }
};

main();
