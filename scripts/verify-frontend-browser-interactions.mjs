import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const chrome = process.env.CHROME_BIN;
// Use the same browser origin as Next's production server authority. The health
// probe may use 127.0.0.1, but browser mutations must remain same-origin rather
// than weakening the production route's Origin protection for a test harness.
const baseUrl = process.env.FRONTEND_BASE_URL ?? "http://localhost:3000";
const evidenceDir = process.env.FRONTEND_EVIDENCE_DIR ?? "artifacts/frontend-evidence";
const requestedZoomPercent = Number(process.env.FRONTEND_BROWSER_ZOOM_PERCENT ?? "100");
const isZoomEvidenceRun = requestedZoomPercent !== 100;

if (!chrome) throw new Error("CHROME_BIN is required for browser interaction verification.");
if (![100, 200].includes(requestedZoomPercent)) {
  throw new Error("FRONTEND_BROWSER_ZOOM_PERCENT must be 100 or 200.");
}
mkdirSync(evidenceDir, { recursive: true });
const browserProfile = mkdtempSync(join(tmpdir(), "klinikos-browser-interactions-"));
if (isZoomEvidenceRun) {
  mkdirSync(join(browserProfile, "Default"), { recursive: true });
  const zoomLevel = Math.log(requestedZoomPercent / 100) / Math.log(1.2);
  // Chromium stores the default StoragePartition page-zoom level in a dictionary.
  // The ordinary profile partition has an empty relative path, whose canonical
  // partition key is "x" ("x" + HexEncode("")). This is intentionally not
  // page-scale emulation or device-pixel scaling: those can enlarge a screenshot
  // without exercising responsive CSS at browser zoom.
  writeFileSync(
    join(browserProfile, "Default", "Preferences"),
    JSON.stringify({ partition: { default_zoom_level: { x: zoomLevel } } }),
  );
}

class PipeCdp {
  constructor(process) {
    this.process = process;
    this.nextId = 1;
    this.pending = new Map();
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
      if (!message.id) continue;
      const pending = this.pending.get(message.id);
      if (!pending) continue;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result ?? {});
    }
  }

  command(method, params = {}, sessionId) {
    const id = this.nextId++;
    const message = { id, method, params, ...(sessionId ? { sessionId } : {}) };
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`${method} timed out.`));
      }, 15_000);
      this.pending.set(id, {
        method,
        resolve: (value) => { clearTimeout(timeout); resolve(value); },
        reject: (error) => { clearTimeout(timeout); reject(error); },
      });
      this.process.stdio[3].write(`${JSON.stringify(message)}\0`);
    });
  }
}

const chromeProcess = spawn(chrome, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--hide-scrollbars",
  "--remote-debugging-pipe",
  "--no-first-run",
  "--no-default-browser-check",
  ...(isZoomEvidenceRun ? ["--window-size=1402,1122"] : []),
  `--user-data-dir=${browserProfile}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe", "pipe", "pipe"] });
chromeProcess.stderr.setEncoding("utf8");
let chromeError = "";
chromeProcess.stderr.on("data", (chunk) => { chromeError += chunk; });

const cdp = new PipeCdp(chromeProcess);
let sessionId;
const results = {};

async function command(method, params = {}) {
  return cdp.command(method, params, sessionId);
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) throw new Error(`Browser expression failed: ${expression}`);
  return response.result?.value;
}

async function waitFor(label, expression, timeoutMs = 12_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await evaluate(expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function setViewport(width, height) {
  await command("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

async function navigate() {
  await command("Page.navigate", { url: `${baseUrl}/` });
  await waitFor(
    "hydrated Living Universe shell",
    `document.readyState === "complete"
      && document.querySelector('[data-living-universe-stage="true"]')
      && document.querySelector('[data-public-object-stage="true"]')
      && document.querySelector('[data-public-inspector="true"]')
      && document.querySelector('[data-public-action-dock="true"]')
      && [...document.images].every((image) => image.complete)`,
  );
}

async function screenshot(label) {
  const response = await command("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const path = join(evidenceDir, `${label}.png`);
  writeFileSync(path, Buffer.from(response.data, "base64"));
  return path;
}

async function pressKey(key, code, windowsVirtualKeyCode, modifiers = 0) {
  await command("Input.dispatchKeyEvent", { type: "rawKeyDown", key, code, windowsVirtualKeyCode, modifiers });
  await command("Input.dispatchKeyEvent", { type: "keyUp", key, code, windowsVirtualKeyCode, modifiers });
}

async function submitActionWithKeyboard(label) {
  let focused = false;
  const visited = [];
  for (let index = 0; index < 96 && !focused; index += 1) {
    await pressKey("Tab", "Tab", 9);
    const focusState = await evaluate(`({
      copy: document.activeElement?.textContent?.trim() || document.activeElement?.getAttribute('aria-label') || document.activeElement?.tagName || '',
      visible: Boolean(document.activeElement?.matches(':focus-visible')),
    })`);
    visited.push(focusState.copy);
    if (focusState.copy === "See every way to begin") {
      await pressKey("Enter", "Enter", 13);
      continue;
    }
    focused = focusState.copy.includes(label) && focusState.visible;
  }
  if (!focused) throw new Error(`Could not reach the ${label} action through the keyboard tab order. Last controls: ${visited.slice(-12).join(" | ")}`);
  await evaluate(`document.activeElement?.click()`);
}

async function typeAndSubmit(text) {
  await evaluate(`document.querySelector('#public-klinikos-intent')?.focus()`);
  await command("Input.insertText", { text });
  await waitFor("enabled Zumi send control", `document.querySelector('button[aria-label="Send message to Zumi"]')?.disabled === false`);
  await evaluate(`document.querySelector('button[aria-label="Send message to Zumi"]')?.click()`);
}

try {
  const target = await cdp.command("Target.createTarget", { url: "about:blank" });
  const attached = await cdp.command("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  sessionId = attached.sessionId;
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Network.enable");

  if (isZoomEvidenceRun) {
    await navigate();
    const layoutMetrics = await command("Page.getLayoutMetrics");
    const zoomState = await evaluate(`(() => {
      const composer = document.querySelector('[data-public-action-dock="true"]')?.getBoundingClientRect();
      const controls = document.querySelector('nav[aria-label="Living Universe mobile controls"]')?.getBoundingClientRect();
      const desktopInspector = document.querySelector('#public-plane-readout-desktop');
      return {
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        devicePixelRatio: window.devicePixelRatio,
        visualViewportWidth: window.visualViewport?.width ?? null,
        visualViewportScale: window.visualViewport?.scale ?? null,
        responsiveMax768: matchMedia('(max-width: 768px)').matches,
        mobileControlsVisible: Boolean(controls && controls.width > 0 && controls.height > 0),
        desktopControlsHidden: Boolean(desktopInspector && desktopInspector.getClientRects().length === 0),
        collisionFree: Boolean(composer && controls && (controls.top >= composer.bottom || controls.bottom <= composer.top)),
        composerRect: composer ? { top: composer.top, right: composer.right, bottom: composer.bottom, left: composer.left } : null,
        controlRect: controls ? { top: controls.top, right: controls.right, bottom: controls.bottom, left: controls.left } : null,
      };
    })()`);
    zoomState.cssLayoutViewportWidth = layoutMetrics.cssLayoutViewport?.clientWidth ?? null;
    zoomState.cssVisualViewportZoom = layoutMetrics.cssVisualViewport?.zoom ?? null;
    const expectedCssWidth = 1402 / (requestedZoomPercent / 100);
    const widthTolerance = 24;
    if (Math.abs(zoomState.innerWidth - expectedCssWidth) > widthTolerance) {
      throw new Error(
        `Chrome did not apply ${requestedZoomPercent}% browser page zoom: expected CSS width near ${expectedCssWidth}, received ${zoomState.innerWidth}.`,
      );
    }
    if (Math.abs(zoomState.visualViewportWidth - zoomState.innerWidth) > 1) {
      throw new Error("Browser page zoom produced an inconsistent visual viewport width.");
    }
    if (Math.abs(zoomState.cssVisualViewportZoom - (requestedZoomPercent / 100)) > 0.01) {
      throw new Error(
        `Chrome layout metrics did not attest ${requestedZoomPercent}% page zoom: ${JSON.stringify(zoomState)}.`,
      );
    }
    if (!zoomState.responsiveMax768 || !zoomState.mobileControlsVisible || !zoomState.desktopControlsHidden) {
      throw new Error(
        `The ${requestedZoomPercent}% browser zoom did not exercise the responsive Living Universe layout: ${JSON.stringify(zoomState)}.`,
      );
    }
    if (!zoomState.collisionFree) {
      throw new Error(
        `Living Universe controls overlap the Zumi composer at ${requestedZoomPercent}% browser zoom: ${JSON.stringify(zoomState)}.`,
      );
    }
    results.zoomMethod = "verified_chrome_profile_page_zoom";
    results.requestedZoomPercent = requestedZoomPercent;
    results.metrics = zoomState;
    results.screenshot = await screenshot("zoom-200-1402x1122");
    writeFileSync(join(evidenceDir, "browser-zoom-200.json"), `${JSON.stringify(results, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } else {
    await setViewport(1402, 1122);
    await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    await navigate();
    results.initial = await screenshot("browser-initial-1402x1122");

  let focusVisible = false;
  for (let index = 0; index < 12 && !focusVisible; index += 1) {
    await pressKey("Tab", "Tab", 9);
    focusVisible = Boolean(await evaluate(`document.activeElement && document.activeElement.matches(':focus-visible')`));
  }
  if (!focusVisible) throw new Error("Keyboard navigation did not expose a focus-visible control.");
  results.keyboardFocus = true;

  await submitActionWithKeyboard("Find healthcare work");
  results.actionActivation = "keyboard-focus-verified-then-focused-control-activated";
  await waitFor("Zumi recomposed Object Stage", `Boolean(document.querySelector('[data-object-stage="true"]'))`);
  const responseState = await evaluate(`({
    hasObjectStage: Boolean(document.querySelector('[data-object-stage="true"]')),
    conversation: document.querySelector('[aria-label="Public Zumi guidance"]')?.textContent || '',
  })`);
  if (!responseState.hasObjectStage) {
    throw new Error(`Zumi responded without a governed Object Stage: ${responseState.conversation}`);
  }
  results.activePath = await screenshot("browser-keyboard-active-path-1402x1122");

  await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
  await navigate();
  const reducedMotion = await evaluate(`matchMedia('(prefers-reduced-motion: reduce)').matches`);
  if (!reducedMotion) throw new Error("Chrome did not apply prefers-reduced-motion.");
  results.reducedMotion = await screenshot("browser-reduced-motion-1402x1122");

  await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
  await setViewport(1440, 1000);
  await navigate();
  results.desktop = await screenshot("browser-desktop-1440x1000");

  await setViewport(1920, 1080);
  await navigate();
  results.wide = await screenshot("browser-wide-1920x1080");

  await setViewport(768, 1024);
  await navigate();
  results.tabletPortrait = await screenshot("browser-tablet-768x1024");

  await setViewport(390, 844);
  await navigate();
  results.mobileClosed = await screenshot("browser-mobile-390x844-closed");
  await evaluate(`document.querySelectorAll('nav[aria-label="Living Universe mobile controls"] details')[1]?.querySelector('summary')?.click()`);
  await waitFor(
    "open mobile plane Inspector",
    `(() => {
      const target = document.querySelector('#public-plane-readout-mobile');
      return target && target.getBoundingClientRect().height > 0 && getComputedStyle(target).visibility !== 'hidden';
    })()`,
  );
  await evaluate(`Array.from(document.querySelectorAll('button[aria-controls="public-plane-readout-mobile"]')).at(-1)?.click()`);
  await waitFor("mobile Compounding Business Inspector", `document.querySelector('#public-plane-readout-mobile')?.textContent?.includes('Compounding Business')`);
  results.mobilePlanes = await screenshot("browser-mobile-390x844-planes-open");

  await evaluate(`document.querySelectorAll('nav[aria-label="Living Universe mobile controls"] details')[1]?.querySelector('summary')?.click()`);
  await evaluate(`document.querySelectorAll('nav[aria-label="Living Universe mobile controls"] details')[0]?.querySelector('summary')?.click()`);
  await waitFor("open mobile action drawer", `document.querySelectorAll('nav[aria-label="Living Universe mobile controls"] details')[0]?.open === true`);
  results.mobileStart = await screenshot("browser-mobile-390x844-start-open");

  await setViewport(1024, 900);
  await navigate();
  const collisionFree = await evaluate(`(() => {
    const composer = document.querySelector('[data-public-action-dock="true"]')?.getBoundingClientRect();
    const controls = document.querySelector('nav[aria-label="Living Universe mobile controls"]')?.getBoundingClientRect();
    return Boolean(composer && controls && (controls.top >= composer.bottom || controls.bottom <= composer.top));
  })()`);
  if (!collisionFree) throw new Error("Tablet controls overlap the Zumi composer.");
  results.tablet = await screenshot("browser-tablet-1024x900-collision-check");

  await setViewport(1402, 1122);
  await navigate();
  await command("Network.setBlockedURLs", { urls: [`${baseUrl}/api/zumi/public`] });
  await typeAndSubmit("Help me understand Klinikos");
  await waitFor("honest unreachable state", `document.body.innerText.includes("I can't reach Klinikos right now")`);
  results.error = await screenshot("browser-error-state-1402x1122");
  await command("Network.setBlockedURLs", { urls: [] });

    writeFileSync(join(evidenceDir, "browser-interactions.json"), `${JSON.stringify(results, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n${chromeError}\n`);
  process.exitCode = 1;
} finally {
  const exited = new Promise((resolve) => {
    if (chromeProcess.exitCode !== null) resolve();
    else chromeProcess.once("exit", resolve);
  });
  try { await cdp.command("Browser.close"); } catch { chromeProcess.kill("SIGTERM"); }
  await Promise.race([exited, delay(2_000)]);
  if (chromeProcess.exitCode === null) chromeProcess.kill("SIGTERM");
  await Promise.race([exited, delay(2_000)]);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      rmSync(browserProfile, { force: true, recursive: true });
      break;
    } catch (error) {
      if (attempt === 2) throw error;
      await delay(100);
    }
  }
}
