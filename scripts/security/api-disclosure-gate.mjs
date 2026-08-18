import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const API_ROOT = path.join(ROOT, "src", "app", "api");
const failures = [];

const FORBIDDEN_RESPONSE_PATTERNS = [
  {
    key: "raw-validation-details",
    pattern: /\b(?:details|issues)\s*:\s*[^\n,}]*(?:\.error\.issues|\.issues\b)/,
    message: "raw validation issue arrays must remain server-side",
  },
  {
    key: "raw-error-message",
    pattern: /\berror\s*:\s*(?:error|err|cause)\.message\b/,
    message: "unexpected exception messages must be normalized before browser delivery",
  },
  {
    key: "raw-error-stack",
    pattern: /\b(?:stack|stackTrace|trace)\s*:\s*(?:error|err|cause)(?:\.stack)?\b/,
    message: "exception stack/trace detail must remain server-side",
  },
  {
    key: "environment-secret-name",
    pattern: /\b(?:requiredServerSecret|secretEnv|secretEnvironment|missingEnv|environmentVariable)\s*:/,
    message: "credential/environment topology must not be an API response field",
  },
  {
    key: "ai-internal-telemetry",
    pattern: /\b(?:providerKey|modelId|promptVersion|costMicroUsd|auditLogId|cognitionTrace|toolGraph)\s*:/,
    message: "AI provider/cost/prompt/internal orchestration telemetry is not browser presentation data",
  },
  {
    key: "raw-process-env-response",
    pattern: /(?:NextResponse|Response)\.json\([\s\S]{0,1000}?process\.env(?:\.|\[)/,
    message: "API JSON must not serialize process.env state",
  },
  {
    key: "raw-sensitive-object-spread",
    pattern: /(?:NextResponse|Response)\.json\([\s\S]{0,600}?\.\.\.(?:session|config|current)\b/,
    message: "session/configuration objects must be projected into an explicit browser DTO before response",
  },
];

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

function lineForOffset(text, offset) {
  return text.slice(0, offset).split("\n").length;
}

function scanRoute(file) {
  const text = fs.readFileSync(file, "utf8");
  for (const rule of FORBIDDEN_RESPONSE_PATTERNS) {
    const flags = rule.pattern.flags.includes("g") ? rule.pattern.flags : `${rule.pattern.flags}g`;
    const expression = new RegExp(rule.pattern.source, flags);
    for (const match of text.matchAll(expression)) {
      failures.push(`${rel(file)}:${lineForOffset(text, match.index ?? 0)} :: ${rule.key} :: ${rule.message}`);
    }
  }
}

for (const file of walk(API_ROOT)) {
  if (!/route\.(?:ts|tsx|js|jsx)$/.test(file)) continue;
  scanRoute(file);
}

if (failures.length) {
  console.error("\nKlinikos API disclosure gate FAILED.\n");
  for (const failure of failures) console.error(`- ${failure}`);
  console.error("\nBuild a minimum-necessary server-side presentation DTO or normalize the error before sending JSON to the browser.\n");
  process.exitCode = 1;
} else {
  console.log("Klinikos API disclosure gate passed.");
}
