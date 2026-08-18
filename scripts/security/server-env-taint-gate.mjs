import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SOURCE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const SAFE_BUILD_ENV = new Set(["NODE_ENV"]);
const ALLOWED_PUBLIC_ENV = new Set(["NEXT_PUBLIC_APP_URL"]);
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

function isSourceFile(file) {
  return SOURCE_EXTENSIONS.includes(path.extname(file).toLowerCase());
}

function read(file) {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function isClientRoot(text) {
  return /^\s*["']use client["'];/.test(text.slice(0, 800).replace(/^\uFEFF/, ""));
}

function stripTypeOnlyImports(text) {
  return text
    .replace(/import\s+type\b[\s\S]*?\bfrom\s*["'][^"']+["']\s*;?/g, "")
    .replace(/export\s+type\b[\s\S]*?\bfrom\s*["'][^"']+["']\s*;?/g, "");
}

function importSpecifiers(text) {
  const runtime = stripTypeOnlyImports(text);
  const values = [];
  for (const pattern of [
    /(?:from\s*|import\s*\(\s*|require\s*\(\s*)["']([^"']+)["']/g,
    /import\s*["']([^"']+)["']/g,
  ]) {
    for (const match of runtime.matchAll(pattern)) values.push(match[1]);
  }
  return [...new Set(values)];
}

function sourceCandidates(base) {
  const candidates = [base];
  if (!path.extname(base)) {
    for (const extension of SOURCE_EXTENSIONS) candidates.push(`${base}${extension}`);
    for (const extension of SOURCE_EXTENSIONS) candidates.push(path.join(base, `index${extension}`));
  }
  return candidates;
}

function resolveSourceImport(fromFile, specifier) {
  let base = null;
  if (specifier.startsWith("@/")) base = path.join(ROOT, "src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(fromFile), specifier.replace(/[?#].*$/, ""));
  else return null;

  for (const candidate of sourceCandidates(base)) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile() && isSourceFile(candidate)) return path.resolve(candidate);
  }
  return null;
}

function explicitEnvRefs(text) {
  const values = [];
  const expression = /process\.env(?:\.([A-Z0-9_]+)|\[["']([A-Z0-9_]+)["']\])/g;
  for (const match of text.matchAll(expression)) values.push(match[1] ?? match[2]);
  return [...new Set(values)];
}

function hasDynamicEnvAccess(text) {
  const withoutExplicit = text.replace(/process\.env(?:\.[A-Z0-9_]+|\[["'][A-Z0-9_]+["']\])/g, "");
  return /process\.env\b/.test(withoutExplicit);
}

function privateEnvRefs(text) {
  return explicitEnvRefs(text).filter((name) => !name.startsWith("NEXT_PUBLIC_") && !SAFE_BUILD_ENV.has(name));
}

function invalidPublicEnvRefs(text) {
  return explicitEnvRefs(text).filter((name) => name.startsWith("NEXT_PUBLIC_") && !ALLOWED_PUBLIC_ENV.has(name));
}

function run() {
  const sourceFiles = walk(path.join(ROOT, "src")).filter(isSourceFile).map((file) => path.resolve(file));
  const textByFile = new Map(sourceFiles.map((file) => [file, read(file)]));
  const tainted = new Map();

  for (const file of sourceFiles) {
    const text = textByFile.get(file) ?? "";
    const privateRefs = privateEnvRefs(text);
    const badPublicRefs = invalidPublicEnvRefs(text);
    const dynamic = hasDynamicEnvAccess(text);

    if (privateRefs.length || dynamic) {
      tainted.set(file, {
        privateRefs,
        dynamic,
      });
    }

    if (isClientRoot(text)) {
      for (const name of privateRefs) {
        failures.push(`${rel(file)} :: client-private-env :: '${name}' is server-confidential`);
      }
      for (const name of badPublicRefs) {
        failures.push(`${rel(file)} :: client-public-env :: '${name}' is not on the approved browser allowlist`);
      }
      if (dynamic) failures.push(`${rel(file)} :: client-dynamic-env :: dynamic process.env access is forbidden in client code`);
    }
  }

  const deps = new Map();
  function dependencies(file) {
    if (deps.has(file)) return deps.get(file);
    const resolved = importSpecifiers(textByFile.get(file) ?? "")
      .map((specifier) => resolveSourceImport(file, specifier))
      .filter(Boolean);
    deps.set(file, resolved);
    return resolved;
  }

  for (const root of sourceFiles.filter((file) => isClientRoot(textByFile.get(file) ?? ""))) {
    const queue = [{ file: root, chain: [root] }];
    const visited = new Set([root]);

    while (queue.length) {
      const current = queue.shift();
      for (const dependency of dependencies(current.file)) {
        if (visited.has(dependency)) continue;
        visited.add(dependency);
        const chain = [...current.chain, dependency];
        const reason = tainted.get(dependency);
        if (reason) {
          const detail = reason.dynamic
            ? "dynamic process.env access"
            : `private env ${reason.privateRefs.join(", ")}`;
          failures.push(
            `${rel(root)} :: transitive-server-env :: ${detail} reached via ${chain.map(rel).join(" -> ")}`,
          );
          continue;
        }
        queue.push({ file: dependency, chain });
      }
    }
  }

  if (failures.length) {
    console.error("\nKlinikos server environment taint gate FAILED.\n");
    for (const failure of failures) console.error(`- ${failure}`);
    console.error("\nMove environment-dependent logic behind a server-only boundary and pass only a reviewed presentation value to the browser.\n");
    process.exitCode = 1;
    return;
  }

  console.log("Klinikos server environment taint gate passed.");
}

run();
