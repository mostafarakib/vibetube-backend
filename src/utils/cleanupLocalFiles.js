import fs from "fs";

const deleteFile = (path) => {
  try {
    if (path && fs.existsSync(path)) {
      fs.unlinkSync(path);
      console.log("File deleted from local:", path);
    }
  } catch (err) {
    console.error("File delete error:", err.message);
  }
};

const cleanupLocalFiles = (files) => {
  console.log("Cleaning up local files:", files);
  if (!files) return;

  if (Array.isArray(files)) {
    files.forEach((file) => deleteFile(file.path));
  } else {
    Object.values(files).forEach((fileArray) => {
      fileArray.forEach((file) => deleteFile(file.path));
    });
  }
};

export { cleanupLocalFiles };
