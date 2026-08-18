import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const failures = [];

const ALLOWED_PUBLIC_ENV = new Set(["NEXT_PUBLIC_APP_URL"]);
const CLIENT_FORBIDDEN_IMPORTS = [
  /^@\/lib\/db$/,
  /^@\/lib\/repositories(?:\/|$)/,
  /^@\/lib\/orchestration(?:\/|$)/,
  /^@\/features\/zumi\/(?:gateway|master-directive|trusted-orchestration|quality-guardian-context|conversation-policy|providers|policy|redaction|tool-security|memory|canonical-context|entitlements|tool-catalog|client-projection)(?:$|\/)/,
  /^@\/lib\/security\/(?:events|session-risk|step-up|secrets|server-env)(?:$|\/)/,
  /^@\/docs(?:\/|$)/,
];
const CLIENT_FORBIDDEN_RESOLVED_PATHS = [
  /^src\/lib\/db(?:\.[a-z]+)?$/i,
  /^src\/lib\/repositories(?:\/|$)/,
  /^src\/lib\/orchestration(?:\/|$)/,
  /^src\/features\/zumi\/(?:gateway|master-directive|trusted-orchestration|quality-guardian-context|conversation-policy|providers|policy|redaction|tool-security|memory|canonical-context|entitlements|tool-catalog|client-projection)(?:\.|\/|$)/,
  /^src\/lib\/security\/(?:events|session-risk|step-up|secrets|server-env)(?:\.|\/|$)/,
  /^docs(?:\/|$)/,
];

const CLIENT_FORBIDDEN_MARKERS = [
  "ZUMI_MASTER_DIRECTIVE_VERSION",
  "ZUMI_CONVERSATION_SIGNING_SECRET",
  "KLINIKOS_FOUNDER_USER_IDS",
  "KLINIKOS_STEP_UP_SIGNING_SECRET",
  "DOCUMENT_ENCRYPTION_KEY",
  "STRIPE_SECRET_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "GOOGLE_AI_API_KEY",
  "DATABASE_URL",
  "Trusted Klinikos orchestration result:",
  "Trusted Quality Guardian result:",
  "Approved durable memory relevant to this user",
  "Klinikos repository context selected for this question",
];

const SECRET_PATTERNS = [
  { name: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
  { name: "github-classic-token", pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  { name: "github-fine-grained-token", pattern: /\bgithub_pat_[A-Za-z0-9_]{40,}\b/ },
  { name: "stripe-secret-key", pattern: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/ },
  { name: "openai-project-key", pattern: /\bsk-proj-[A-Za-z0-9_-]{20,}\b/ },
  { name: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
];

const PUBLIC_FORBIDDEN_EXTENSIONS = new Set([
  ".map", ".env", ".sql", ".db", ".sqlite", ".sqlite3", ".pem", ".key", ".p12", ".pfx", ".log", ".bak", ".old", ".zip", ".tar", ".gz", ".dump",
]);
const PUBLIC_FORBIDDEN_NAME = /(?:^|[-_.])(secret|private|internal|backup|dump|database|credentials?)(?:[-_.]|$)/i;
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json", ".md", ".yml", ".yaml", ".txt", ".svg", ".css", ".html", ".toml"]);

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function fail(file, rule, detail) {
  failures.push(`${rel(file)} :: ${rule} :: ${detail}`);
}

function walk(dir, options = {}) {
  if (!fs.existsSync(dir)) return [];
  const output = [];
  const skip = options.skip ?? new Set();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...walk(full, options));
    else output.push(full);
  }
  return output;
}

function readText(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function isClientModule(text) {
  const prefix = text.slice(0, 800).replace(/^\uFEFF/, "");
  return /^\s*["']use client["'];/.test(prefix);
}

function importSpecifiers(text) {
  const values = [];
  const patterns = [
    /(?:from\s*|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g,
    /import\s*["']([^"']+)["']/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) values.push(match[1]);
  }
  return values;
}

function resolvedClientTarget(file, specifier) {
  if (!specifier.startsWith(".")) return null;
  const absolute = path.resolve(path.dirname(file), specifier.replace(/[?#].*$/, ""));
  return rel(absolute);
}

function forbiddenClientImport(file, specifier) {
  if (CLIENT_FORBIDDEN_IMPORTS.some((pattern) => pattern.test(specifier))) return true;
  const resolved = resolvedClientTarget(file, specifier);
  return Boolean(resolved && CLIENT_FORBIDDEN_RESOLVED_PATHS.some((pattern) => pattern.test(resolved)));
}

function environmentNames(text) {
  const names = new Set();
  for (const match of text.matchAll(/\bNEXT_PUBLIC_[A-Z0-9_]+\b/g)) names.add(match[0]);
  return [...names];
}

function processEnvReferences(text) {
  const names = [];
  const expression = /process\.env(?:\.([A-Z0-9_]+)|\[["']([A-Z0-9_]+)["']\])/g;
  for (const match of text.matchAll(expression)) names.push(match[1] ?? match[2]);
  return names;
}

function scanClientModules() {
  const src = path.join(ROOT, "src");
  for (const file of walk(src)) {
    if (!/\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(file)) continue;
    const text = readText(file);
    if (!text || !isClientModule(text)) continue;

    for (const specifier of importSpecifiers(text)) {
      if (forbiddenClientImport(file, specifier)) {
        fail(file, "client-import", `client module imports server-confidential module '${specifier}'`);
      }
    }

    for (const name of processEnvReferences(text)) {
      if (!name.startsWith("NEXT_PUBLIC_")) {
        fail(file, "client-env", `client module references non-public environment variable '${name}'`);
      } else if (!ALLOWED_PUBLIC_ENV.has(name)) {
        fail(file, "client-env-allowlist", `public environment variable '${name}' is not explicitly allowlisted`);
      }
    }

    for (const marker of CLIENT_FORBIDDEN_MARKERS) {
      if (text.includes(marker)) fail(file, "client-marker", `confidential marker '${marker}' appears in a client module`);
    }
  }
}

function scanPublicEnvironmentSurface() {
  const candidates = [
    path.join(ROOT, ".env.example"),
    path.join(ROOT, "render.yaml"),
    path.join(ROOT, "next.config.ts"),
    ...walk(path.join(ROOT, "src")),
  ];

  for (const file of candidates) {
    if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) continue;
    const text = readText(file);
    if (!text) continue;
    for (const name of environmentNames(text)) {
      if (!ALLOWED_PUBLIC_ENV.has(name)) {
        fail(file, "public-env-allowlist", `NEXT_PUBLIC value '${name}' is not approved for browser disclosure`);
      }
    }
  }
}

function scanPublicAssets() {
  const publicRoot = path.join(ROOT, "public");
  for (const file of walk(publicRoot)) {
    const extension = path.extname(file).toLowerCase();
    const basename = path.basename(file);
    if (PUBLIC_FORBIDDEN_EXTENSIONS.has(extension)) {
      fail(file, "public-asset-extension", `high-risk '${extension}' asset must not be web-addressable`);
    }
    if (PUBLIC_FORBIDDEN_NAME.test(basename)) {
      fail(file, "public-asset-name", "filename indicates internal/private/secret material in public/");
    }
    if (TEXT_EXTENSIONS.has(extension)) {
      const text = readText(file);
      if (!text) continue;
      for (const secret of SECRET_PATTERNS) {
        if (secret.pattern.test(text)) fail(file, "public-secret-shape", `looks like ${secret.name}`);
      }
      for (const marker of CLIENT_FORBIDDEN_MARKERS) {
        if (text.includes(marker)) fail(file, "public-confidential-marker", `contains confidential marker '${marker}'`);
      }
    }
  }
}

function scanRepositorySecretShapes() {
  const files = walk(ROOT, {
    skip: new Set([".git", ".next", "node_modules", "coverage", "out"]),
  });
  for (const file of files) {
    const extension = path.extname(file).toLowerCase();
    if (!TEXT_EXTENSIONS.has(extension) && ![".env.example", ".gitignore"].includes(path.basename(file))) continue;
    const text = readText(file);
    if (!text) continue;
    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(text)) fail(file, "secret-shape", `looks like committed ${secret.name}`);
    }
  }
}

function scanNextConfig() {
  const file = path.join(ROOT, "next.config.ts");
  const text = readText(file);
  if (!text) {
    fail(file, "next-config", "next.config.ts is missing or unreadable");
    return;
  }
  if (!/productionBrowserSourceMaps\s*:\s*false\b/.test(text)) {
    fail(file, "source-maps", "productionBrowserSourceMaps must be explicitly false");
  }
}

function scanBuiltBrowserArtifacts() {
  const staticRoot = path.join(ROOT, ".next", "static");
  if (!fs.existsSync(staticRoot)) return;
  for (const file of walk(staticRoot)) {
    const extension = path.extname(file).toLowerCase();
    if (extension === ".map") {
      fail(file, "built-source-map", "production browser source map was generated into .next/static");
      continue;
    }
    if (![".js", ".json", ".css", ".html", ".txt"].includes(extension)) continue;
    const text = readText(file);
    if (!text) continue;
    for (const marker of CLIENT_FORBIDDEN_MARKERS) {
      if (text.includes(marker)) fail(file, "bundle-confidential-marker", `browser artifact contains '${marker}'`);
    }
    for (const secret of SECRET_PATTERNS) {
      if (secret.pattern.test(text)) fail(file, "bundle-secret-shape", `browser artifact looks like ${secret.name}`);
    }
  }
}

function run() {
  scanClientModules();
  scanPublicEnvironmentSurface();
  scanPublicAssets();
  scanRepositorySecretShapes();
  scanNextConfig();
  scanBuiltBrowserArtifacts();

  if (failures.length) {
    console.error("\nKlinikos browser confidentiality gate FAILED.\n");
    for (const item of failures) console.error(`- ${item}`);
    console.error("\nThe browser is an untrusted disclosure environment. Keep confidential logic/data server-side or explicitly review and allowlist intentional public state.\n");
    process.exitCode = 1;
    return;
  }

  console.log("Klinikos browser confidentiality gate passed.");
}

run();
