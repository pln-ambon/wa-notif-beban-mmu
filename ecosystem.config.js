// Jalankan `npm run build` dulu; PM2 menjalankan hasil kompilasi di dist/.
module.exports = {
  apps: [
    {
      name: "wa-notif-beban-mmu-7002",
      script: "./dist/app.js",
    },
  ],
};
