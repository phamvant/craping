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
