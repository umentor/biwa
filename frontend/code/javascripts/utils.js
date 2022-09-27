const fs = require("fs");
const modulePath = require("path");

const logger = (function() {
  return {
    info: msg => console.log("\x1b[34m%s\x1b[0m", "[info] [Layouts]" + msg),
    error: msg => console.error("\x1b[31m%s\x1b[0m", "[error] [Layouts]" + msg)
  };
})();

function is_dir(path) {
  try {
    return fs.lstatSync(path).isDirectory();
  } catch (e) {
    return false;
  }
}

function replaceVars(content, args) {
  const substituteArgs = args =>
    content.replace(/@@(?!(content|include))([\w.]+)/g, varName => {
      return varName
        .substring(2)
        .split(".")
        .reduce((acc, key) => acc[key], args);
    });

  if (args) {
    try {
      content = substituteArgs(JSON.parse(args));
    } catch (e) {
      logger.error(e);
      return content;
    }
  }

  return content;
}

function getRequiredFiles(context, path) {
  let requiredFiles = [];
  let files = fs.readdirSync(modulePath.join(context, path));

  files.forEach(file => {
    const filePath = modulePath.join(context, path, file);

    if (is_dir(filePath)) {
      requiredFiles = getRequiredFiles(context, modulePath.join(path, file)).concat(requiredFiles);
    } else {
      /\.html$/.test(file) && (requiredFiles = requiredFiles.concat(modulePath.join(path, file)));
    }
  });

  return requiredFiles;
}

module.exports = {
  logger,
  getRequiredFiles,
  replaceVars
};
