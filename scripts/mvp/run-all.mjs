import { spawnSync } from "node:child_process";
import { delimiter, join } from "node:path";

const root = process.cwd();
const tsxCli = join(root, "node_modules", "tsx", "dist", "cli.mjs");
const stubRoot = join(root, "scripts", "mvp", "node-stubs");
const nodePath = [stubRoot, process.env.NODE_PATH].filter(Boolean).join(delimiter);

// Fresh deploy runs first because it explicitly proves an empty migrated database.
// Every subsequent journey owns and cleans up its own test data.
const journeys = [
  "fresh-deploy-journey.ts",
  "commercial-journey.mts",
  "stripe-payment-journey.mts",
  "activation-journey.mts",
  "operations-journey.mts",
  "grid-journey.mts",
  "grid-trust-journey.mts",
  "zumi-journey.ts",
  "tenant-isolation-journey.mts",
  "role-routing-journey.ts",
  "failure-recovery-journey.ts",
];

for (const journey of journeys) {
  console.log(`\n=== MVP journey: ${journey} ===`);
  const result = spawnSync(process.execPath, [tsxCli, join(root, "scripts", "mvp", journey)], {
    cwd: root,
    env: { ...process.env, NODE_PATH: nodePath },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log(`\nAll ${journeys.length} MVP journeys passed.`);
