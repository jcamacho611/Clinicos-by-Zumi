import { setTimeout as delayFor } from "node:timers/promises";

const STARTUP_COMMAND_TIMEOUT_MS = 30_000;

/**
 * Attach the browser verifier to Chrome's initial about:blank page when it exists.
 * Creating a second target during a cold GitHub-runner startup can block before any
 * customer surface is tested, so target creation is a fallback rather than the first
 * operation. Startup retries remain bounded and preserve the final diagnostic cause.
 */
export async function attachBrowserPageTarget({
  command,
  delay = delayFor,
  maxAttempts = 3,
}) {
  let finalError;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const targets = await command("Target.getTargets", {}, STARTUP_COMMAND_TIMEOUT_MS);
      const existingTarget = (targets.targetInfos ?? []).find((target) => target.type === "page");
      const targetSource = existingTarget ? "existing" : "created";
      const targetId = existingTarget?.targetId ?? (
        await command("Target.createTarget", { url: "about:blank" }, STARTUP_COMMAND_TIMEOUT_MS)
      ).targetId;

      if (!targetId) throw new Error("Chrome did not provide a page target id.");
      const attached = await command(
        "Target.attachToTarget",
        { targetId, flatten: true },
        STARTUP_COMMAND_TIMEOUT_MS,
      );
      if (!attached.sessionId) throw new Error("Chrome did not provide a page session id.");

      return { sessionId: attached.sessionId, targetId, targetSource };
    } catch (error) {
      finalError = error;
      if (attempt < maxAttempts) await delay(250 * attempt);
    }
  }

  const cause = finalError instanceof Error ? finalError.message : String(finalError);
  throw new Error(`Chrome page target was unavailable after ${maxAttempts} attempts: ${cause}`);
}
