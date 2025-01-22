import { readFile } from "fs/promises";

import sql from "mssql";

const config = {
  user: "ThuanLogin",
  password: "Strongpwd1",
  server: "localhost",
  database: "DreamhackerTest",
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const files = [
  "data500.json",
  "data505.json",
  "data555.json",
  "data605.json",
  "data655.json",
  "data705.json",
  "data805.json",
  "data805.json",
];

const character = ["A", "B", "C", "D", "E"];
const characterToNumber = (character: string) => {
  return character.charCodeAt(0) - 65;
};

const mapping = {
  "500": "505",
  "505": "555",
  "555": "605",
  "605": "655",
  "655": "705",
  "705": "805",
  "805": "805+",
};
const directory_id = 1;

const createDatabaseConnection = async () => {
  try {
    const pool = await sql.connect(config);
    console.log("Connected to database");
    return pool;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
};

const main = async () => {
  const pool = await createDatabaseConnection();

  const generateInsert = async (pool: sql.ConnectionPool, file: string) => {
    const data = await readFile(`./${file}`, "utf8");
    const json = JSON.parse(data);
    let errorCount = 0;

    for (const key in json) {
      const questions = json[key];
      let idxQuestion = 1;

      for (const question of questions) {
        try {
          const insertQuestion = `INSERT INTO questions (topic_id, difficulty, content, explanation, type) 
      VALUES (@p1, @p2, @p3, @p4, @p5);
      SELECT SCOPE_IDENTITY() as id`;

          const result = await pool
            .request()
            .input("p1", sql.Int, idxQuestion)
            .input("p2", sql.VarChar, mapping[question.data.range])
            .input("p3", sql.VarChar, question.data.question)
            .input("p4", sql.VarChar, question.data.explanation)
            .input("p5", sql.VarChar, "multiple_choice")
            .query(insertQuestion);

          const questionId = result.recordset[0].id;

          // Insert options
          let idxOption = 0;
          for (const option of question.data.options) {
            const insertOptions = `INSERT INTO answers (question_id, content, is_correct) 
                VALUES (@p1, @p2, @p3);`;

            const result = await pool
              .request()
              .input("p1", sql.Int, questionId)
              .input("p2", sql.VarChar, option ?? "")
              .input(
                "p3",
                sql.Bit,
                idxOption === characterToNumber(question.data.answer)
              )
              .query(insertOptions);

            if (result.rowsAffected[0] === 0) {
              const deleteQuestion = `DELETE FROM questions WHERE id = @p1;`;
              await pool
                .request()
                .input("p1", sql.Int, questionId)
                .query(deleteQuestion);

              throw new Error("Failed to insert option");
            }

            idxOption++;
          }
        } catch (error) {
          errorCount++;
          console.log(error.message);
        }
      }

      idxQuestion++;
    }

    console.log(`Error count: ${errorCount}`);
  };

  for (const file of files) {
    await generateInsert(pool, file);
  }
};

main();

// console.log(characterToNumber("D"));
