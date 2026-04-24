const { spawn } = require("node:child_process");

const workspace = process.cwd();
const isWindows = process.platform === "win32";
const children = [];

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: workspace,
    stdio: "inherit",
    shell: isWindows,
    ...options,
  });

  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
}

function shutdown() {
  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGINT");
    }
  }
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

const db = run("docker", ["compose", "up", "-d", "db"]);

db.on("exit", (code) => {
  if (code && code !== 0) {
    process.exit(code);
    return;
  }

  children.push(
    run("npx", ["ts-node-dev", "--respawn", "--transpile-only", "src/api.ts"], {
      env: { ...process.env, PORT: "5300" },
    }),
  );

  children.push(
    run("npx", ["ts-node-dev", "--respawn", "--transpile-only", "src/processor.ts"], {
      env: { ...process.env, PORT: "5301" },
    }),
  );
});
