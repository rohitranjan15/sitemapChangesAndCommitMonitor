const fs = require("fs");

function createFolderIfNotExists(folderPath) {
  if (!(fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory())) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

module.exports = { createFolderIfNotExists };
