import { readFile } from "fs/promises";
import { a500 as ps500 } from "../input/PS/500";
import { a500 as ds500 } from "../input/DS/500";
import { a500 as cr500 } from "../input/CR/500";
import { a500 as sc500 } from "../input/SC/500";
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
];

const folders = ["PS", "DS", "CR", "SC"];

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
  "805": "855",
};

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

function logProgress(errorCount: number) {
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`Error: ${errorCount}`);
}

let qCount = 0;
const insertQuestion = async () => {
  const pool = await createDatabaseConnection();

  let idxQuestion = 1;
  let idxTopic = 1;
  const generateInsert = async (
    pool: sql.ConnectionPool,
    folder: string,
    file: string
  ) => {
    const data = await readFile(`./gmat/output/${folder}/${file}`, "utf8");
    const json = JSON.parse(data);
    let errorCount = 0;

    for (const key in json) {
      const questions = json[key];
      /// Start idx

      for (const question of questions) {
        qCount++;
        try {
          let insertAnswer = question.data.answer;
          let message = "";
          if (insertAnswer.length > 2) {
            message = "Error answer length: " + insertAnswer;
            insertAnswer = null;
          }
          if (question.data.options.length === 0) {
            message = "Error no options";
            insertAnswer = null;
          }
          if (
            question.data.question === undefined ||
            question.data.question.length === 0
          ) {
            message = "Error no question";
            insertAnswer = null;
          }

          const insertQuestion = `INSERT INTO questions (topic_id, difficulty, content, explanation, type, link, is_error)
                                  VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7);
                                  SELECT SCOPE_IDENTITY() as id`;

          const result = await pool
            .request()
            .input("p1", sql.Int, idxQuestion)
            .input("p2", sql.VarChar, mapping[question.data.range])
            .input("p3", sql.VarChar, question.data.question)
            .input("p4", sql.VarChar, question.data.explanation)
            .input("p5", sql.VarChar, "multiple_choice")
            .input("p6", sql.VarChar, question.link)
            .input("p7", sql.Bit, insertAnswer === null)
            .query(insertQuestion);

          const questionId = result.recordset[0].id;

          if (questionId === null) {
            message = "Error insert question";
            throw new Error(message);
          }

          if (insertAnswer === null) {
            throw new Error(message);
          }

          // Insert options
          const transaction = new sql.Transaction();

          try {
            await transaction.begin();

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

              idxOption++;
            }
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            throw error;
          }
        } catch (error) {
          errorCount++;
          console.log(error.message);
          // logProgress(errorCount);
        }
      }

      // console.log(idxQuestion);
      idxQuestion++;
    }

    idxQuestion -= Object.keys(json).length;
    idxTopic = Object.keys(json).length;

    process.stdout.write("\n");
    console.log(`Total error: ${errorCount}`);
  };

  for (const folder of folders) {
    for (const file of files) {
      await generateInsert(pool, folder, file);
    }
    idxQuestion += idxTopic;
    process.stdout.write("\n");
    console.log(`${folder} done`);
  }
  console.log(qCount);

  process.exit(0);
};

const insertCategory = async () => {
  const pool = await createDatabaseConnection();
  const sections = [ps500, ds500, cr500, sc500];

  let idx = 1;
  for (const section of sections) {
    for (const topic of section) {
      const insertCategory = `INSERT INTO topics (directory_id, name) VALUES (@p1, @p2);`;

      const result = await pool
        .request()
        .input("p1", sql.Int, idx)
        .input("p2", sql.VarChar, topic.topic)
        .query(insertCategory);
    }
    console.log(idx);
    idx++;
  }

  process.exit(0);
};

let count = 0;
const insertRC = async () => {
  const pool = await createDatabaseConnection();

  const data = await readFile(`./gmat/output/RC/data500.json`, "utf8");
  const json = JSON.parse(data);

  let idxQuestion = 95;
  for (const key in json) {
    const articles = json[key];
    for (const article of articles) {
      count++;
      try {
        const insertArticle = `INSERT INTO readings (content) VALUES (@p1) SELECT SCOPE_IDENTITY() as id;`;

        const result = await pool
          .request()
          .input("p1", sql.VarChar, article.data.article)
          .query(insertArticle);

        const articleId = result.recordset[0].id;

        for (const question of article.data.questions) {
          const insertQuestion = `INSERT INTO questions (topic_id, difficulty, reading_id, content, explanation, type, link) 
                                  VALUES (@p1, @p2, @p3, @p4, @p5, @p6, @p7);
                                  SELECT SCOPE_IDENTITY() as id`;

          const result = await pool
            .request()
            .input("p1", sql.Int, idxQuestion)
            .input("p2", sql.VarChar, mapping[article.data.range])
            .input("p3", sql.Int, articleId)
            .input("p4", sql.VarChar, question.question)
            .input("p5", sql.VarChar, article.data.explanation)
            .input("p6", sql.VarChar, "multiple_choice")
            .input("p7", sql.VarChar, article.data.link)
            .query(insertQuestion);
          const questionId = result.recordset[0].id;

          if (questionId === null) {
            throw new Error("Error question");
          }

          const transaction = new sql.Transaction();

          try {
            await transaction.begin();

            let idxOption = 0;
            for (const option of question.options) {
              const insertOption = `INSERT INTO answers (question_id, content, is_correct) VALUES (@p1, @p2, @p3);`;

              const result = await pool
                .request()
                .input("p1", sql.Int, questionId)
                .input("p2", sql.VarChar, option)
                .input(
                  "p3",
                  sql.Bit,
                  idxOption === characterToNumber(question.answer)
                )
                .query(insertOption);

              idxOption++;
            }
            await transaction.commit();
          } catch (error) {
            await transaction.rollback();
            throw new Error("Error insert option");
          }
        }
      } catch (error) {
        console.log(error.message);
      }
    }

    idxQuestion++;
    console.log(idxQuestion);
  }
  console.log(count);
  process.exit(0);
};

const argument = process.argv.slice(2);
if (argument.includes("category")) {
  insertCategory();
} else if (argument.includes("question")) {
  insertQuestion();
} else if (argument.includes("rc")) {
  insertRC();
}
