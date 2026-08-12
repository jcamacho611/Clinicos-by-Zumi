import "dotenv/config";
import { spawnSync } from "node:child_process";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    console.error(`Render build failed to start ${command}.`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (databaseUrl) {
  console.log("Applying Klinikos database migrations before deployment...");
  run(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
      },
    },
  );
} else {
  console.warn(
    "DATABASE_URL is not configured during the Render build. Building the public Klinikos shell without applying database migrations.",
  );
}

console.log("Building Klinikos for production...");
run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  env: process.env,
});
