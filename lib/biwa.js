const fs = require("fs");
const path = require("path");
const replace = require("replace-in-file");
const { version } = require("../package.json");
const { spawnSync } = require("child_process");

const spawnOptions = {
  cwd: process.cwd(),
  env: process.env,
  stdio: "inherit",
  encoding: "utf-8",
  dot: true
};
const colors = {
  red: "\x1b[31m%s\x1b[0m",
  green: "\x1b[32m%s\x1b[0m",
  yellow: "\x1b[33m%s\x1b[0m",
  blue: "\x1b[34m%s\x1b[0m",
  magenta: "\x1b[35m%s\x1b[0m",
  cyan: "\x1b[36m%s\x1b[0m",
  white: "\x1b[37m%s\x1b[0m"
};

module.exports = class {
  static dev() {
    spawnSync("yarn", ["dev"], spawnOptions);
  }

  static build() {
    spawnSync("yarn", ["build"], spawnOptions);
  }

  static serve() {
    spawnSync("yarn", ["serve"], spawnOptions);
  }

  static netlify() {
    spawnSync("yarn", ["netlify"], spawnOptions);
  }

  constructor(appPath) {
    this.appPath = appPath;
    this.appName = path.basename(this.appPath);
  }

  async create() {
    if (fs.existsSync(this.appPath)) {
      console.log(`\nDirektori ${this.appPath} sudah ada!\n`);
      process.exit(1);
    }

    console.log();
    console.log("\x1b[32m%s\x1b[0m", `Biwa v${version} siap! Mari buat app Kamu.`);

    await this.sleep(1000);

    try {
      await this.copyFrontend();
      await this.initApp();
      await this.build();
      await this.gitInit();
    } catch (err) {
      await this.rollback(err);
    }

    this.postInstall();
  }

  async copyFrontend() {
    await this.sectionTitle("Membuat struktur direktori");
    const { status } = spawnSync("cp", ["-Rv", this.frontendPath, this.appPath], spawnOptions);
    if (status) {
      throw new Error(`Tidak dapat menyalin frontend ke direktori target ${this.appPath}`);
    } else {
      this.replaceVariables();
    }
  }

  async initApp() {
    await this.sectionTitle("Menginstal dependensi");
    const { status } = spawnSync("yarn", ["--cwd", this.appPath], spawnOptions);
    if (status) {
      throw new Error("Tidak dapat menjalankan perintah 'yarn'");
    }
  }

  async build() {
    await this.sectionTitle("Menjalankan build pertama");
    const { status } = spawnSync("yarn", ["--cwd", this.appPath, "build"], spawnOptions);
    if (status) {
      throw new Error("Tidak dapat menjalankan skrip 'build'");
    }
  }

  async gitInit() {
    await this.sectionTitle("Inisialisasi git repo");
    const { status } = spawnSync("git", ["init", this.appPath], spawnOptions);
    if (status) {
      console.warn("\x1b[31m%s\x1b[0m", "Tidak dapat menjalankan perintah `git init`");
    }
  }

  replaceVariables() {
    replace.sync({
      files: [path.join(this.appPath, "**", "*")],
      from: /\{\{\s*appName\s*\}\}/g,
      to: this.appName
    });
    replace.sync({
      files: [path.join(this.appPath, "**", "*")],
      from: /\{\{\s*version\s*\}\}/g,
      to: version
    });
  }

  async postInstall() {
    console.log();
    console.log("\x1b[32m%s\x1b[0m", "-------------------------------------------");
    console.log();

    await this.sleep(1000);

    console.log(colors.yellow,"########::.####:.##:::::.##::::.###::::");
    console.log(colors.yellow,"##.....##:..##::.##:.##:.##:::.##.##:::");
    console.log(colors.yellow,"##:::::##::.##::.##:.##:.##::.##:..##::");
    console.log(colors.yellow,"########:::.##::.##:.##:.##:.##:::..##:");
    console.log(colors.yellow,"##.....##::.##::.##:.##:.##:.#########:");
    console.log(colors.yellow,"##::::.##::.##::.##:.##:.##:.##.....##:");
    console.log(colors.yellow,"########::.####:..###..###::.##::::.##:");

    console.log("\nMari kita mulai server web dan mulai bekerja:\n");
    console.log(colors.blue, `  cd ${this.appPath}`);
    console.log(colors.blue, "  biwa dev\n");
    console.log("Halaman yang terbuka di browser Kamu akan membantu");
    console.log("Kamu akan memulai pengembangan web app. Selamat mengkode!\n");
  }

  rollback(err) {
    this.sectionTitle("Ada masalah saat membuat app Kamu:(", "error");
    console.group();
    console.error(`${err}`);
    console.error("\nMembersihkan...");
    this.destroy();
    console.groupEnd();
    console.error(
      "Periksa https://github.com/andae/biwa/issues untuk melihat apakah ini sudah dilaporkan."
    );
    console.error();
    process.exit(1);
  }

  destroy() {
    spawnSync("rm", ["-rf", this.appPath], spawnOptions);
    console.log(`Menghapus '${this.appPath}' app\n`);
  }

  async sectionTitle(message, severity = "info") {
    const sevColor = {
      info: colors.green,
      error: colors.red
    };
    const color = sevColor[severity];

    console.log();
    console.log(color, "-------------------------------------------");
    console.log(color, `|  ${message}`);
    console.log(color, "-------------------------------------------\n");
    await this.sleep(1000);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  get frontendPath() {
    return path.resolve(__dirname, "..", "frontend");
  }
};
