const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const dbPath = path.join(__dirname, "dev.db");
const sqlPath = path.join(__dirname, "init.sql");

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const script = [
  "import sqlite3, sys",
  "db_path, sql_path = sys.argv[1], sys.argv[2]",
  "with open(sql_path, 'r', encoding='utf-8') as f:",
  "    sql = f.read()",
  "con = sqlite3.connect(db_path)",
  "try:",
  "    con.executescript(sql)",
  "    con.commit()",
  "finally:",
  "    con.close()"
].join("\n");

try {
  execFileSync("python", ["-c", script, dbPath, sqlPath], { stdio: "inherit" });
} catch (error) {
  console.error("Could not initialize SQLite database:", error?.message ?? error);
  process.exit(1);
}
