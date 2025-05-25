import { readdir, readFile } from "fs/promises";
import { join } from "path";

const countPosts = async () => {
  const folders = ["CR", "DS", "PS", "SC"];
  let totalPosts = 0;

  for (const folder of folders) {
    const folderPath = join("gmat", "output", folder);

    try {
      const files = await readdir(folderPath);

      for (const file of files) {
        const filePath = join(folderPath, file);
        const content = await readFile(filePath, "utf8");
        const data = JSON.parse(content);

        Object.keys(data).forEach((key) => {
          const datas = data[key] as any[];
          datas.forEach((data) => {
            if (data.data.answer.length > 1) {
              console.log(data.data.answer);
            }
          });
        });

        // console.log(`${folder} folder: ${totalPosts}`);
      }
    } catch (err) {
      // console.error(`Error reading ${folder} folder:`, err);
    }
  }

  // console.log("Total posts:", totalPosts);
};

countPosts();
