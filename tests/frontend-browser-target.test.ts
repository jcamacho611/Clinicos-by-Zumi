import { describe, expect, it, vi } from "vitest";
import { attachBrowserPageTarget } from "../scripts/frontend-browser-target.mjs";

describe("frontend browser target attachment", () => {
  it("reuses Chrome's initial page instead of creating a second target", async () => {
    const command = vi.fn(async (method: string) => {
      if (method === "Target.getTargets") {
        return { targetInfos: [{ targetId: "initial-page", type: "page", url: "about:blank" }] };
      }
      if (method === "Target.attachToTarget") return { sessionId: "session-1" };
      throw new Error(`Unexpected command: ${method}`);
    });

    await expect(attachBrowserPageTarget({ command })).resolves.toEqual({
      sessionId: "session-1",
      targetId: "initial-page",
      targetSource: "existing",
    });
    expect(command).not.toHaveBeenCalledWith("Target.createTarget", expect.anything(), expect.anything());
  });

  it("creates a page only when Chrome exposes no reusable page target", async () => {
    const command = vi.fn(async (method: string) => {
      if (method === "Target.getTargets") return { targetInfos: [] };
      if (method === "Target.createTarget") return { targetId: "created-page" };
      if (method === "Target.attachToTarget") return { sessionId: "session-2" };
      throw new Error(`Unexpected command: ${method}`);
    });

    await expect(attachBrowserPageTarget({ command })).resolves.toMatchObject({
      sessionId: "session-2",
      targetId: "created-page",
      targetSource: "created",
    });
  });

  it("retries bounded Chrome startup failures before attaching", async () => {
    let attempts = 0;
    const command = vi.fn(async (method: string) => {
      if (method === "Target.getTargets") {
        attempts += 1;
        if (attempts === 1) throw new Error("Chrome is still starting");
        return { targetInfos: [{ targetId: "ready-page", type: "page", url: "about:blank" }] };
      }
      if (method === "Target.attachToTarget") return { sessionId: "session-3" };
      throw new Error(`Unexpected command: ${method}`);
    });

    await expect(attachBrowserPageTarget({ command, delay: async () => undefined })).resolves.toMatchObject({
      sessionId: "session-3",
      targetId: "ready-page",
    });
    expect(attempts).toBe(2);
  });

  it("fails with the final startup cause after bounded retries", async () => {
    const command = vi.fn(async () => {
      throw new Error("pipe unavailable");
    });

    await expect(attachBrowserPageTarget({
      command,
      delay: async () => undefined,
      maxAttempts: 2,
    })).rejects.toThrow("Chrome page target was unavailable after 2 attempts: pipe unavailable");
  });
});
