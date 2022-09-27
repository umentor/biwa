#!/usr/bin/env node

const Biwa = require("./lib/biwa");
console.log("Coba `biwa --help` untuk opsi penggunaan");

require("yargs")
  .usage("Gunakan $0 <command> [options]")
  .command(
    "new [path]",
    "Membuat web app Biwa baru",
    yargs => {
      yargs.positional("path", {
        describe: "Path ke web app Kamu (contoh. ~/path/my_app)"
      });
    },
    argv => {
      new Biwa(argv.path).create();
    }
  )
  .command(
    "destroy [path]",
    "Menghapus Biwa app",
    yargs => {
      yargs.positional("path", {
        describe: "Path ke web app Kamu yang sudah ada (contoh. ~/path/my_app)"
      });
    },
    argv => {
      new Biwa(argv.name).destroy();
    }
  )
  .command(
    "dev",
    "Mulai server web dan perhatikan basis kode untuk perubahan",
    () => {},
    argv => {
      Biwa.dev();
    }
  )
  .command(
    "build",
    "Membangun aset siap produksi ke dalam /publish",
    () => {},
    argv => {
      Biwa.build();
    }
  )
  .command(
    "serve",
    "Memulai server web untuk melayani direktori /publish",
    () => {},
    argv => {
      Biwa.serve();
    }
  )
  .command(
    "netlify",
    "Memulai instance dev netlify untuk pengujian fungsi lokal",
    () => {},
    argv => {
      Biwa.netlify();
    }
  ).argv;
