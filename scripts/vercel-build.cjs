const { execFileSync } = require("node:child_process");

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db"
};

function run(command, args) {
  execFileSync(command, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32"
  });
}

run("npx", ["prisma", "generate"]);
run("npm", ["run", "db:init"]);
run("npm", ["run", "db:seed"]);
run("npx", ["next", "build"]);
