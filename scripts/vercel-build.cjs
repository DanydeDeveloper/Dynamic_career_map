const { execFileSync } = require("node:child_process");

const env = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL || "file:./dev.db"
};

function run(command, args) {
  console.log(`[vercel-build:v2] ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    stdio: "inherit",
    env,
    shell: process.platform === "win32"
  });
}

console.log(`[vercel-build:v2] DATABASE_URL=${env.DATABASE_URL}`);
run("npx", ["prisma", "generate"]);
run("npm", ["run", "db:init"]);
run("npm", ["run", "db:seed"]);
run("npx", ["next", "build"]);
