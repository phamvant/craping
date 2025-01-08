import { readFile, writeFile } from "fs/promises";

interface GMAT {
  data: {
    question: string;
    options: string[];
    answer: string;
    explaination: string;
  };
  link: string;
}

const pattern = [
  ["a)", "b)", "c)", "d)", "e)"],
  ["A)", "B)", "C)", "D)", "E)"],
  ["A.", "B.", "C.", "D.", "E."],
  ["(1)", "(2)", "(3)", "(4)", "(5)"],
];

export function answerParse(content: string): {
  question: string;
  options: string[];
} {
  let idx = 0;
  let patternIdx = -1;
  let question;

  const options = content.split("\n").reduce((acc, cur) => {
    if (patternIdx === -1) {
      patternIdx = pattern.findIndex((val) => cur.includes(val[0]));
      if (patternIdx !== -1) {
        const questionPart = content.split(pattern[patternIdx][idx])[0];
        const lastNewlineIndex = questionPart.lastIndexOf("\n");
        question = questionPart.slice(0, lastNewlineIndex);
      }
    }

    if (patternIdx === -1) {
      return acc;
    }

    if (cur.includes(pattern[patternIdx][idx])) {
      acc.push(cur.split(pattern[patternIdx][idx])[1].trimStart());
      idx++;
    }

    return acc;
  }, [] as string[]);

  return { question, options };
}

// async function main() {
//   const content = await readFile("./gmat/output/data500.json", "utf-8");

//   const gmatData = JSON.parse(content) as { [key: string]: GMAT[] };
//   for (const key in gmatData) {
//     let idx = 0;
//     for (const content of gmatData[key]) {
//       const ret = answerParse(content.data.question);
//       gmatData[key][idx].data.options = ret.options;
//       gmatData[key][idx].data.question = ret.question;
//       idx++;
//     }
//   }

//   await writeFile("./gmat/output/test.json", JSON.stringify(gmatData), "utf-8");
// }
