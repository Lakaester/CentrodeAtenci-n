const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

rl.question("Pega aqui tu contrasena y presiona Enter: ", (pwd) => {
  const pass = encodeURIComponent(pwd.trim());
  const url = "postgresql://pgvector_user:" + pass + "@169.197.82.217:5432/pgvector_db?schema=public";
  const contenido =
    'DATABASE_URL="' + url + '"\n' +
    "BACKEND_PORT=4000\n" +
    "NODE_ENV=development\n" +
    "CORS_ORIGIN=http://localhost:5173\n";
  fs.writeFileSync(path.join(__dirname, "backend", ".env"), contenido, "utf8");
  console.log("\nListo: backend/.env quedo configurado correctamente.");
  rl.close();
});