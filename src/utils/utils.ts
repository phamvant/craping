import fs from "fs/promises";
import path from "path";
// import HTMLToJSX from "htmltojsx";

async function getPosts(dir: string) {
  return (await fs.readdir(dir)).map((post) => {
    return path.join(dir, post);
  });
}

async function getCategory(dir: string) {
  const postDir = await fs.readdir(dir);
  const ret = [];
  for (const post of postDir) {
    ret.push({
      category: post,
      post: await getPosts(path.join(dir, post)),
    });
  }

  return ret;
}

async function getRootFolder(rootDir: string) {
  const categoryDir = await fs.readdir(rootDir);
  const ret = [];
  for (const category of categoryDir) {
    ret.push(await getCategory(path.join(rootDir, category)));
  }

  return ret;
}

export async function getAllPost() {
  const ret: { category: string; post: string[] }[][] = [];

  await getRootFolder(path.join(process.cwd(), "result"))
    .then((program) => program[0])
    .then((category) => category)
    .then((posts) => ret.push(posts));

  return ret;
}

// export const convertHTMLToJSX = (html: string) => {
//   const converter = new HTMLToJSX({ createClass: false });
//   return converter.convert(html);
// };

export async function getPost(param: string) {
  let ret;

  (await getAllPost()).forEach((level) => {
    return level.forEach((category) => {
      return category.post.forEach((post) => {
        const regex = /(\d+)\.html$/;
        const match = post.match(regex);
        const number = match ? match[1] : null;
        if (number === param) {
          ret = post;
        }
      });
    });
  });

  const content = (await fs.readFile(ret! as string)).toString();

  // return convertHTMLToJSX(content);
}

getAllPost()
  .then((data) => data[0])
  .then((data) => data.map((dat) => dat.post))
  .then((data: any) => data.flat(Infinity))
  .then((data) => {
    fs.writeFile("contents.json", JSON.stringify({ posts: data }));
  });
