/**
 * Compatibility shim for a Render service whose dashboard Start Command still names this
 * file directly.
 *
 * The production start path is `npm start`, which is `next start`. This file used to be
 * that path, and it also ran `prisma migrate deploy` before handing over — so every wake
 * of a sleeping instance re-did deployment work, and an unreachable database meant the
 * web process never started at all. Migrations now belong to the deploy/build lifecycle
 * and are not reintroduced here.
 *
 * The file was deleted when the start path changed. A Render service configured through
 * the dashboard rather than the Blueprint keeps its own Start Command, which repository
 * changes cannot update — so if that command still points here, deleting the file turns
 * every boot into an immediate failure and the platform serves 502 with no application
 * process behind it.
 *
 * It therefore exists only to forward to the real start command. It is safe to remove
 * once the Render service's Start Command is confirmed to be `npm start`.
 */
import { spawn } from "node:child_process";

console.log("[startup] scripts/render-start.mjs is a compatibility shim; forwarding to `next start`.");
console.log("[startup] Update the Render Start Command to `npm start` so this shim can be removed.");

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
