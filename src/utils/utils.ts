import path from "path";
const fs = require("fs");
const archiver = require("archiver");

const clear = (cateId: number) => {
  const srcDirs = ["cn", "en", "vn"];

  for (const srcDir of srcDirs) {
    const output = fs.createWriteStream(
      srcDir + "/" + cateId + "_" + srcDir + ".zip"
    );
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level.
    });

    // Listen for all archive data to be written.
    output.on("close", function () {
      console.log(archive.pointer() + " total bytes");
      console.log(
        "Archiver has been finalized and the output file descriptor has closed."
      );
    });

    // Good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on("warning", function (err) {
      if (err.code === "ENOENT") {
        // Log warning
        console.warn(err);
      } else {
        // Throw error
        throw err;
      }
    });

    // Good practice to catch this error explicitly
    archive.on("error", function (err) {
      throw err;
    });

    // Pipe archive data to the file
    archive.pipe(output);

    fs.readdir(srcDir, (err, files) => {
      if (err) {
        throw err;
      }

      files.forEach((file) => {
        const filePath = path.join(srcDir, file);
        archive.file(filePath, { name: file });
      });

      // Finalize the archive after appending all files
      archive.finalize();
    });
  }
};

clear(14);
