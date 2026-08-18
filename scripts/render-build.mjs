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

// Compile the exact application candidate before any production schema mutation.
// This prevents a TypeScript/Next build failure from advancing the database while
// the prior application release remains the only deployable artifact. Migrations
// must still remain backward-compatible with the previous app during rollout.
console.log("Building Klinikos for production before database migration...");
run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], {
  env: process.env,
});

if (databaseUrl) {
  console.log("Application build passed. Applying Klinikos database migrations for deployment...");
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
    "DATABASE_URL is not configured during the Render build. The application was built without applying database migrations.",
  );
}
