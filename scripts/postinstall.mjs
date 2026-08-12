import { spawnSync } from "node:child_process";

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, { env, stdio: "inherit" });

  if (result.error) {
    console.error(`Postinstall failed to start ${command}.`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const npm = process.platform === "win32" ? "npm.cmd" : "npm";

if (process.env.RENDER === "true") {
  console.log("Render detected during install; running the Klinikos deploy build.");
  run(npm, ["run", "render:build"]);
} else {
  console.log("Generating the Prisma client after local install.");
  run(process.execPath, ["node_modules/prisma/build/index.js", "generate"]);
}
