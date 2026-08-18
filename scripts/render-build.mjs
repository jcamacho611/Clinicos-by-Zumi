import "dotenv/config";
import { spawnSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

function run(label, command, args, options = {}) {
  const startedAt = Date.now();
  console.log(`\n[render-build] START ${label}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    console.error(`[render-build] FAILED ${label}: could not start ${command}.`, result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`[render-build] FAILED ${label}: exit ${result.status ?? 1}.`);
    process.exit(result.status ?? 1);
  }

  console.log(
    `[render-build] PASSED ${label} in ${((Date.now() - startedAt) / 1000).toFixed(1)}s`,
  );
}

const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

console.log(`[render-build] node ${process.version}`);
console.log(`[render-build] database configured: ${databaseUrl ? "yes" : "no"}`);
console.log(
  `[render-build] candidate ${process.env.RENDER_GIT_COMMIT || process.env.GITHUB_SHA || "unknown"}`,
);

if (!databaseUrl) {
  console.error(
    "[render-build] REFUSED: DATABASE_URL or DIRECT_DATABASE_URL is required for the production build contract.",
  );
  process.exit(2);
}

// Validate schema syntax/configuration without mutating production state.
run("Prisma schema validation", npmCommand, ["run", "db:validate"], {
  env: process.env,
});

// Compile the exact application candidate before any production schema mutation.
// This prevents a TypeScript/Next build failure from advancing the database while
// the prior application release remains the only deployable artifact. Migrations
// must still remain backward-compatible with the previous app during rollout.
run("production application build", npmCommand, ["run", "build"], {
  env: process.env,
});

// Only after the candidate compiles do we advance the production schema.
run(
  "database migration deploy",
  process.execPath,
  ["node_modules/prisma/build/index.js", "migrate", "deploy"],
  {
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
  },
);

console.log("\n[render-build] COMPLETE: build and migration contract passed.");
