/**
 * Production start preflight.
 *
 * `next start` requires a build. When `.next` is absent it exits immediately, the
 * platform restarts it, and it exits again — a crash loop whose only symptom is
 * "Exited with status 1" plus a Next.js error that says a build is missing without
 * saying why it is missing.
 *
 * There is a specific way to reach that state here. The canonical build command passes
 * `--ignore-scripts`, which disables this repository's `postinstall` — and `postinstall`
 * used to be what triggered the build on the host. So a Build Command that installs but
 * does not go on to run the build succeeds, exits 0, and the platform starts a service
 * that was never built.
 *
 * This preflight turns that into one legible line naming the exact command that is
 * missing. It deliberately does NOT build here: building on boot would re-run deployment
 * work every time a sleeping instance wakes, and would risk exhausting memory on a small
 * instance. The build belongs to the deploy, and this only reports when it did not happen.
 */
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

// BUILD_ID rather than the directory: `next build` writes it last, so its presence means
// a completed build rather than a partial or interrupted one.
if (!existsSync(".next/BUILD_ID")) {
  console.error(
    [
      "",
      "Klinikos cannot start: there is no production build in .next.",
      "",
      "The application was installed but never built, so this process would exit and be",
      "restarted indefinitely. Nothing is wrong with the application code.",
      "",
      "The deploy's Build Command must install AND build. It should be exactly:",
      "",
      "    npm ci --include=dev --ignore-scripts && npm run render:build",
      "",
      "The second half is required. `--ignore-scripts` disables postinstall, so nothing",
      "else will produce a build.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start"],
  { env: process.env, stdio: "inherit" },
);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code, signal) => {
  process.exit(signal === "SIGTERM" ? 0 : (code ?? 1));
});

server.on("error", (error) => {
  console.error("[startup] Klinikos server failed to start.", error);
  process.exit(1);
});
