import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { attachBrowserPageTarget } from "./frontend-browser-target.mjs";

const chrome = process.env.CHROME_BIN;
const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
const evidenceDir = process.env.FRONTEND_EVIDENCE_DIR ?? "artifacts/frontend-evidence";

if (!chrome) throw new Error("CHROME_BIN is required for Living Reality browser verification.");
mkdirSync(evidenceDir, { recursive: true });

class PipeCdp {
  constructor(process) {
    this.process = process;
    this.nextId = 1;
    this.pending = new Map();
    this.eventWaiters = new Map();
    this.buffer = "";
    process.stdio[4].setEncoding("utf8");
    process.stdio[4].on("data", (chunk) => this.#receive(chunk));
    process.once("exit", (code) => {
      for (const { reject } of this.pending.values()) reject(new Error(`Chrome exited early (${code ?? "signal"}).`));
      this.pending.clear();
    });
  }

  #receive(chunk) {
    this.buffer += chunk;
    for (;;) {
      const boundary = this.buffer.indexOf("\0");
      if (boundary < 0) return;
      const raw = this.buffer.slice(0, boundary);
      this.buffer = this.buffer.slice(boundary + 1);
      if (!raw) continue;
      const message = JSON.parse(raw);
      if (message.method) {
        const key = `${message.sessionId ?? "browser"}:${message.method}`;
        const waiters = this.eventWaiters.get(key) ?? [];
        this.eventWaiters.delete(key);
        for (const waiter of waiters) waiter.resolve(message.params ?? {});
      }
      if (!message.id) continue;
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result ?? {});
    }
  }

  command(method, params = {}, sessionId, timeoutMs = 15_000) {
    const id = this.nextId++;
    const message = { id, method, params, ...(sessionId ? { sessionId } : {}) };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out.`));
      }, timeoutMs);
      this.pending.set(id, {
        method,
        resolve: (value) => { clearTimeout(timeout); resolve(value); },
        reject: (error) => { clearTimeout(timeout); reject(error); },
      });
      this.process.stdio[3].write(`${JSON.stringify(message)}\0`);
    });
  }

  waitForEvent(method, sessionId, timeoutMs = 15_000) {
    const key = `${sessionId ?? "browser"}:${method}`;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const remaining = (this.eventWaiters.get(key) ?? []).filter((waiter) => waiter.resolve !== wrappedResolve);
        if (remaining.length) this.eventWaiters.set(key, remaining);
        else this.eventWaiters.delete(key);
        reject(new Error(`${method} event timed out.`));
      }, timeoutMs);
      const wrappedResolve = (value) => {
        clearTimeout(timeout);
        resolve(value);
      };
      const waiters = this.eventWaiters.get(key) ?? [];
      waiters.push({ resolve: wrappedResolve });
      this.eventWaiters.set(key, waiters);
    });
  }
}

function launchChrome(label) {
  const profile = mkdtempSync(join(tmpdir(), `klinikos-living-reality-${label}-`));
  const process = spawn(chrome, [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--hide-scrollbars",
    "--remote-debugging-pipe",
    "--no-first-run",
    "--no-default-browser-check",
    `--user-data-dir=${profile}`,
    "about:blank",
  ], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
  process.stderr.setEncoding("utf8");
  let stderr = "";
  process.stderr.on("data", (chunk) => { stderr += chunk; });
  return { process, profile, stderr: () => stderr };
}

async function cleanupBrowser(browser, cdp) {
  const exited = new Promise((resolve) => {
    if (browser.process.exitCode !== null) resolve();
    else browser.process.once("exit", resolve);
  });
  try { await cdp.command("Browser.close"); } catch { browser.process.kill("SIGTERM"); }
  await Promise.race([exited, delay(2_000)]);
  if (browser.process.exitCode === null) browser.process.kill("SIGTERM");
  await Promise.race([exited, delay(2_000)]);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      rmSync(browser.profile, { force: true, recursive: true });
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await delay(100);
    }
  }
}

async function runScenario(label, configure, execute) {
  const browser = launchChrome(label);
  const cdp = new PipeCdp(browser.process);
  let sessionId;

  const command = (method, params = {}) => cdp.command(method, params, sessionId);
  const evaluate = async (expression) => {
    const response = await command("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (response.exceptionDetails) throw new Error(`Browser expression failed: ${expression}`);
    return response.result?.value;
  };
  const waitFor = async (name, expression, timeoutMs = 15_000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await evaluate(`Boolean(${expression})`)) return;
      await delay(100);
    }
    throw new Error(`Timed out waiting for ${name}.`);
  };
  const setViewport = (width, height) => command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const screenshot = async (name) => {
    const response = await command("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const destination = join(evidenceDir, `${name}.png`);
    writeFileSync(destination, Buffer.from(response.data, "base64"));
    return destination;
  };
  const navigateHome = async () => {
    const loaded = cdp.waitForEvent("Page.loadEventFired", sessionId);
    const navigation = await command("Page.navigate", { url: `${baseUrl}/` });
    if (navigation.errorText) throw new Error(`Page.navigate failed: ${navigation.errorText}`);
    await loaded;
    await waitFor(
      "hydrated public Living Universe",
      `document.readyState === "complete"
        && document.querySelector('[data-living-universe-stage="true"]')
        && document.querySelector('[data-public-object-stage="true"]')
        && document.querySelector('[data-public-action-dock="true"]')`,
    );
  };
  const activateDesktopWorkPath = async () => {
    const clicked = await evaluate(`(() => {
      const controls = Array.from(document.querySelectorAll('button[data-public-action-id="work"]'));
      const visible = controls.find((control) => {
        const rect = control.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      visible?.click();
      return Boolean(visible);
    })()`);
    if (!clicked) throw new Error("Could not find the visible Find healthcare work action.");
    await waitFor(
      "governed healthcare work Object Stage",
      `Boolean(document.querySelector('[data-object-stage="true"]')
        && document.querySelector('[data-living-reality-mode]'))`,
      20_000,
    );
  };

  try {
    const attached = await attachBrowserPageTarget({
      command: (method, params, timeoutMs) => cdp.command(method, params, undefined, timeoutMs),
    });
    sessionId = attached.sessionId;
    await command("Page.enable");
    await command("Runtime.enable");
    await command("Network.enable");
    await configure({ command, evaluate, waitFor, setViewport });
    return await execute({ command, evaluate, waitFor, setViewport, screenshot, navigateHome, activateDesktopWorkPath });
  } catch (error) {
    const detail = browser.stderr();
    throw new Error(`${label}: ${error instanceof Error ? error.stack : String(error)}\n${detail}`);
  } finally {
    await cleanupBrowser(browser, cdp);
  }
}

const results = {
  livingRealityPrecision: null,
  livingRealitySemanticWorkflow: false,
  livingRealityReducedMotion: null,
  livingRealityMobile: null,
};

results.livingRealityPrecision = await runScenario(
  "precision",
  async ({ command, setViewport }) => {
    await setViewport(1402, 900);
    await command("Page.addScriptToEvaluateOnNewDocument", {
      source: `(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function(type, ...args) {
          const normalized = String(type).toLowerCase();
          if (normalized === "webgl" || normalized === "webgl2" || normalized === "experimental-webgl") return null;
          return original.call(this, type, ...args);
        };
      })();`,
    });
  },
  async ({ evaluate, waitFor, screenshot, navigateHome, activateDesktopWorkPath }) => {
    await navigateHome();
    await activateDesktopWorkPath();
    await waitFor(
      "GPU-less Precision Mode",
      `document.querySelector('[data-living-reality-mode="PRECISION_MODE"][data-living-reality-status="precision"]')
        && document.body.innerText.includes("Full interface available without 3D.")`,
    );
    const evidence = await evaluate(`(() => {
      const host = document.querySelector('[data-living-reality-mode]');
      const stage = document.querySelector('[data-object-stage="true"]');
      const continuation = stage?.querySelector('a[href^="/signup?returnTo="]');
      continuation?.focus();
      return {
        mode: host?.getAttribute('data-living-reality-mode') ?? null,
        status: host?.getAttribute('data-living-reality-status') ?? null,
        fallbackCopy: host?.textContent?.includes('Full interface available without 3D.') ?? false,
        hasCanvas: Boolean(host?.querySelector('canvas')),
        semanticStage: Boolean(stage),
        continuationHref: continuation?.getAttribute('href') ?? null,
        continuationFocusable: document.activeElement === continuation,
      };
    })()`);
    const expectedPrecision = { hasCanvas: false };
    if (evidence.mode !== "PRECISION_MODE"
      || evidence.status !== "precision"
      || !evidence.fallbackCopy
      || evidence.hasCanvas !== expectedPrecision.hasCanvas
      || !evidence.semanticStage
      || !evidence.continuationHref
      || !evidence.continuationFocusable) {
      throw new Error(`GPU-less Precision continuity failed: ${JSON.stringify(evidence)}.`);
    }
    results.livingRealitySemanticWorkflow = true;
    evidence.screenshot = await screenshot("living-reality-precision-no-webgl");
    return evidence;
  },
);

results.livingRealityReducedMotion = await runScenario(
  "reduced-motion",
  async ({ command, setViewport }) => {
    await setViewport(1402, 900);
    await command("Emulation.setEmulatedMedia", {
      media: "screen",
      features: [{ name: "prefers-reduced-motion", value: "reduce" }],
    });
  },
  async ({ evaluate, waitFor, screenshot, navigateHome, activateDesktopWorkPath }) => {
    await navigateHome();
    await activateDesktopWorkPath();
    await waitFor(
      "reduced-motion Living Reality decision",
      `(() => {
        const mode = document.querySelector('[data-living-reality-mode]')?.getAttribute('data-living-reality-mode');
        return matchMedia('(prefers-reduced-motion: reduce)').matches
          && (mode === 'BALANCED_REALITY' || mode === 'PRECISION_MODE');
      })()`,
    );
    const evidence = await evaluate(`(() => {
      const host = document.querySelector('[data-living-reality-mode]');
      return {
        prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        mode: host?.getAttribute('data-living-reality-mode') ?? null,
        status: host?.getAttribute('data-living-reality-status') ?? null,
        hasCanvas: Boolean(host?.querySelector('canvas')),
        semanticStage: Boolean(document.querySelector('[data-object-stage="true"]')),
      };
    })()`);
    if (!evidence.prefersReducedMotion
      || !["BALANCED_REALITY", "PRECISION_MODE"].includes(evidence.mode)
      || !evidence.semanticStage) {
      throw new Error(`Reduced-motion Reality evidence failed: ${JSON.stringify(evidence)}.`);
    }
    evidence.screenshot = await screenshot("living-reality-reduced-motion");
    return evidence;
  },
);

results.livingRealityMobile = await runScenario(
  "mobile",
  async ({ setViewport }) => {
    await setViewport(390, 844);
  },
  async ({ evaluate, waitFor, screenshot, navigateHome }) => {
    await navigateHome();
    const drawerOpened = await evaluate(`(() => {
      const trigger = document.querySelector('[data-mobile-drawer="start"]');
      trigger?.click();
      return Boolean(trigger);
    })()`);
    if (!drawerOpened) throw new Error("Mobile Start drawer trigger is missing.");
    await waitFor(
      "mobile Start sheet",
      `document.querySelector('[data-mobile-sheet-panel="true"]')?.getAttribute('data-mobile-sheet') === 'start'`,
    );
    const clicked = await evaluate(`(() => {
      const action = document.querySelector('[data-mobile-sheet-panel="true"] button[data-public-action-id="work"]');
      action?.click();
      return Boolean(action);
    })()`);
    if (!clicked) throw new Error("Mobile Find healthcare work action is missing.");
    await waitFor(
      "mobile governed healthcare work Object Stage",
      `Boolean(!document.querySelector('[data-mobile-sheet-panel="true"]')
        && document.querySelector('[data-object-stage="true"]')
        && document.querySelector('[data-living-reality-mode]'))`,
      20_000,
    );
    const evidence = await evaluate(`(() => {
      const host = document.querySelector('[data-living-reality-mode]');
      const stage = document.querySelector('[data-object-stage="true"]');
      const continuation = stage?.querySelector('a[href^="/signup?returnTo="]');
      const noHorizontalOverflow = document.documentElement.scrollWidth <= window.innerWidth + 1;
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        mode: host?.getAttribute('data-living-reality-mode') ?? null,
        status: host?.getAttribute('data-living-reality-status') ?? null,
        noHorizontalOverflow,
        semanticStage: Boolean(stage),
        continuationVisible: Boolean(continuation && continuation.getBoundingClientRect().width > 0),
      };
    })()`);
    if (evidence.viewport.width !== 390
      || !evidence.noHorizontalOverflow
      || !evidence.semanticStage
      || !evidence.continuationVisible) {
      throw new Error(`Mobile Living Reality recomposition failed: ${JSON.stringify(evidence)}.`);
    }
    evidence.screenshot = await screenshot("living-reality-mobile-390x844");
    return evidence;
  },
);

writeFileSync(join(evidenceDir, "living-reality-browser.json"), `${JSON.stringify(results, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
