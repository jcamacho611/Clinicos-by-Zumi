import fs from "node:fs";
import path from "node:path";
import { findDisclosureFailures } from "./api-disclosure-rules.mjs";

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, "src", "app", "api");
const failures = [];

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full));
    else output.push(full);
  }
  return output;
}

for (const file of walk(API_ROOT)) {
  if (!/route\.(?:ts|tsx|js|jsx)$/.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const failure of findDisclosureFailures(text)) {
    failures.push(`${rel(file)}:${failure.line} :: ${failure.key} :: ${failure.message}`);
  }
}

if (failures.length) {
  console.error("\nKlinikos API disclosure gate FAILED.\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(
    "\nBuild a minimum-necessary server-side presentation DTO or normalize the error before sending JSON to the browser.\n",
  );
  process.exitCode = 1;
} else {
  console.log("Klinikos API disclosure gate passed.");
}
