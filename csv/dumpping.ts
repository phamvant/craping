import { readFile } from "fs/promises";
import { Pool } from "pg";
import { School } from ".";

const pg = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "thuan286",
  port: 5432,
});

const main = async () => {
  const client = await pg.connect();
  const file = await readFile("./csv/xxx3.json", "utf-8");

  const schools = JSON.parse(file) as School[];
  const existingSchools = (await client.query(
    "SELECT id, name FROM schools"
  )) as { rows: { id: string; name: string }[] };

  const transaction = await client.query("BEGIN");
  try {
    for (const school of schools) {
      const existingSchool = existingSchools.rows.find(
        (s: { id: string; name: string }) => s.name === school.name
      );
      let schoolId;

      //   if (existingSchool) {
      //     schoolId = existingSchool.id;
      //     const updateSchool = await client.query(
      //       `UPDATE schools SET
      //           cd_name = $1,
      //           logo = $2,
      //           location = $3,
      //           founded = $4,
      //           type = $5,
      //           qs_world_rank = $6,
      //           us_news_rank_world = $7,
      //           total_students = $8,
      //           acceptance_rate = $9,
      //           average_gpa = $10,
      //           average_gre = $11,
      //           average_toefl = $12,
      //           number_of_applications = $13,
      //           number_of_admissions = $14,
      //           tuition_in_state = $15,
      //           tuition_out_state = $16,
      //           tuition_international = $17,
      //           description = $18,
      //           website = $19
      //         WHERE id = $20`,
      //       [
      //         school.cd_name,
      //         school.logo,
      //         school.location,
      //         school.founded,
      //         school.type,
      //         school.qs_world_rank,
      //         school.us_news_rank_world,
      //         school.total_students,
      //         school.acceptance_rate,
      //         school.average_gpa,
      //         school.average_gre,
      //         school.average_toefl,
      //         school.number_of_applications,
      //         school.number_of_admissions,
      //         school.tuition.in_state,
      //         school.tuition.out_state,
      //         school.tuition.international,
      //         school.description,
      //         school.website,
      //         existingSchool.id,
      //       ]
      //     );
      //   } else {
      if (!existingSchool) {
        const newTag = await client.query(
          `INSERT INTO tags (name) VALUES ($1) RETURNING id`,
          [school.name]
        );

        console.log("d", newTag.rows);
        if (newTag.rows.length === 0) {
          throw new Error("Failed to create tag");
        }

        console.log(newTag.rows[0].id);
        const newSchool = await client.query(
          `INSERT INTO schools (
            name, nation, nationcode, tag_id, cd_name, location, founded, type, qs_world_rank, us_news_rank_world,
            total_students, acceptance_rate, average_gpa, average_gre, average_toefl,
            number_of_applications, number_of_admissions, tuition_in_state, tuition_out_state,
            tuition_international, description, website
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          RETURNING id`,
          [
            school.name,
            school.nation,
            school.nationcode,
            newTag.rows[0].id,
            school.cd_name,
            school.location,
            school.founded,
            school.type,
            school.qs_world_rank,
            school.us_news_rank_world,
            school.total_students,
            school.acceptance_rate,
            school.average_gpa,
            school.average_gre,
            school.average_toefl,
            school.number_of_applications,
            school.number_of_admissions,
            school.tuition.in_state,
            school.tuition.out_state,
            Math.floor(school.tuition.international),
            school.description,
            school.website,
          ]
        );

        schoolId = newSchool.rows[0].id;

        if (
          school.campus_life &&
          school.campus_life.housing_options &&
          school.campus_life.housing_options.length > 0
        ) {
          for (const option of school.campus_life.housing_options) {
            await client.query(
              `INSERT INTO housing_options (school_id, housing_option) 
             VALUES ($1, $2)`,
              [schoolId, option]
            );
          }
        }

        // Insert campus life data
        if (school.campus_life) {
          await client.query(
            `INSERT INTO campus_life (school_id, student_clubs, sports_teams)
           VALUES ($1, $2, $3)
           ON CONFLICT (school_id) 
           DO UPDATE SET 
             student_clubs = $2,
             sports_teams = $3`,
            [
              schoolId,
              school.campus_life.student_clubs,
              school.campus_life.sports_teams,
            ]
          );
        }

        // Insert admission requirements
        if (school.admission_requirements) {
          await client.query(
            `INSERT INTO admission_requirements (school_id, gpa, gre, toefl)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (school_id)
           DO UPDATE SET
             gpa = $2,
             gre = $3,
             toefl = $4`,
            [
              schoolId,
              school.admission_requirements.gpa,
              school.admission_requirements.gre,
              school.admission_requirements.toefl,
            ]
          );
        }

        for (const department of school.departments) {
          const newDepartment = await client.query(
            `INSERT INTO departments (
          school_id, name, law_school_rank_us, business_school_rank_us,
          medicine_school_rank_us, engineer_school_rank_us,
          number_of_applications, number_of_admissions, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
            [
              schoolId,
              department.name,
              department.law_school_rank_us,
              department.business_school_rank_us,
              department.medicine_school_rank_us,
              department.engineer_school_rank_us,
              department.number_of_applications,
              department.number_of_admissions,
              department.description,
            ]
          );

          const departmentId = newDepartment.rows[0].id;

          // Insert department admission requirements
          if (department.admission_requirements) {
            await client.query(
              `INSERT INTO department_admission_requirements (
            department_id, gpa, gre, toefl
          ) VALUES ($1, $2, $3, $4)`,
              [
                departmentId,
                department.admission_requirements.gpa,
                department.admission_requirements.gre,
                department.admission_requirements.toefl,
              ]
            );
          }
          console.log("Done ", school.name);
        }
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    throw error;
  }
};

main();
