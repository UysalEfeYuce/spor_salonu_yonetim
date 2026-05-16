const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const mysql = require("mysql2/promise");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || "localhost",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    multipleStatements: true,
  });

  await connection.query(fs.readFileSync(path.join(__dirname, "database.sql"), "utf8"));
  await connection.end();
  console.log("Veritabani hazir.");
}

main().catch((error) => {
  console.error("Veritabani kurulum hatasi:", error.message);
  process.exit(1);
});
