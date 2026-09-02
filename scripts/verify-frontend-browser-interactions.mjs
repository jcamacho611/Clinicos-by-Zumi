import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000/";
const chromeCandidates = [
  process.env.CHROME_BIN,
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].filter(Boolean);

function invariant(condition, message, detail) {
  if (condition) return;
  const suffix = detail === undefined ? "" : `\n${JSON.stringify(detail, null, 2)}`;
  throw new Error(`${message}${suffix}`);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findChrome() {
  const { access } = await import("node:fs/promises");
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next known runner path.
    }
  }
  throw new Error("No supported Chrome/Chromium binary was found for frontend interaction verification.");
}

class CdpConnection {
  constructor(url) {
    this.url = url;
    this.nextId = 1;
    this.pending = new Map();
    this.socket = null;
  }

  async connect() {
    invariant(typeof WebSocket === "function", "Node must provide the browser-compatible WebSocket global.");
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Timed out connecting to Chrome DevTools.")), 10_000);
      this.socket.addEventListener("open", () => {
        clearTimeout(timeout);
        resolve();
      }, { once: true });
      this.socket.addEventListener("error", () => {
        clearTimeout(timeout);
        reject(new Error("Chrome DevTools WebSocket connection failed."));
      }, { once: true });
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(`${pending.method}: ${message.error.message}`));
      else pending.resolve(message.result ?? {});
    });
  }

  send(method, params = {}) {
    invariant(this.socket?.readyState === WebSocket.OPEN, "Chrome DevTools socket is not open.");
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { method, resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket?.close();
  }
}

async function waitForDevTools(stderrBuffer, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const match = stderrBuffer.text.match(/DevTools listening on (ws:\/\/[^\s]+)/);
    if (match) return match[1];
    await delay(50);
  }
  throw new Error(`Chrome did not expose a DevTools endpoint.\n${stderrBuffer.text}`);
}

async function waitForPageTarget(port, timeoutMs = 10_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
        if (target) return target.webSocketDebuggerUrl;
      }
    } catch {
      // Chrome may still be starting.
    }
    await delay(50);
  }
  throw new Error("Chrome never exposed a page DevTools target.");
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(`Browser evaluation failed: ${result.exceptionDetails.text ?? "unknown exception"}`);
  }
  return result.result?.value;
}

async function waitUntil(cdp, expression, label, timeoutMs = 15_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await evaluate(cdp, expression)) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

async function navigate(cdp, url = baseUrl) {
  await cdp.send("Page.navigate", { url });
  await waitUntil(cdp, "document.readyState === 'complete'", "document readiness");
  await waitUntil(cdp, "Boolean(document.querySelector('[data-public-universe-shell=\"true\"]'))", "Living Universe shell");
}

async function dispatchTab(cdp, { shift = false } = {}) {
  const modifiers = shift ? 8 : 0;
  // This is intentionally real browser input. The release contract checks for
  // Input.dispatchKeyEvent so keyboard QA cannot regress into DOM `.focus()` calls.
  await cdp.send("Input.dispatchKeyEvent", {
    type: "rawKeyDown",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers,
  });
  await cdp.send("Input.dispatchKeyEvent", {
    type: "keyUp",
    key: "Tab",
    code: "Tab",
    windowsVirtualKeyCode: 9,
    nativeVirtualKeyCode: 9,
    modifiers,
  });
  await delay(60);
}

const FOCUS_STATE_EXPRESSION = String.raw`(() => {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return null;
  const rect = el.getBoundingClientRect();
  const style = getComputedStyle(el);
  const cx = Math.min(Math.max(rect.left + rect.width / 2, 1), innerWidth - 1);
  const cy = Math.min(Math.max(rect.top + rect.height / 2, 1), innerHeight - 1);
  const top = document.elementFromPoint(cx, cy);
  const outlineWidth = Number.parseFloat(style.outlineWidth || "0");
  const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0 && rect.top < innerHeight && rect.left < innerWidth;
  const unobscured = Boolean(top && (top === el || el.contains(top) || top.contains(el)));
  const focusVisible = el.matches(":focus-visible");
  const indicator = (style.outlineStyle !== "none" && outlineWidth >= 1) || style.boxShadow !== "none";
  return {
    tag: el.tagName,
    text: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 90),
    visible,
    unobscured,
    focusVisible,
    indicator,
    rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
  };
})()`;

async function verifyKeyboardFocus(cdp, label, tabCount = 8) {
  await evaluate(cdp, "document.activeElement?.blur(); document.body.setAttribute('tabindex','-1'); document.body.focus();");
  const samples = [];
  for (let index = 0; index < tabCount; index += 1) {
    await dispatchTab(cdp);
    const sample = await evaluate(cdp, FOCUS_STATE_EXPRESSION);
    if (sample) samples.push(sample);
  }

  invariant(samples.length >= 4, `${label}: keyboard traversal did not reach enough real controls.`, samples);
  const failures = samples.filter((sample) => !sample.visible || !sample.unobscured || !sample.focusVisible || !sample.indicator);
  invariant(failures.length === 0, `${label}: a keyboard focus stop was invisible, obscured, or lacked a focus-visible indicator.`, failures);
  return samples;
}

async function setViewport(cdp, width, height, deviceScaleFactor = 1) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor,
    mobile: width <= 520,
  });
}

async function verifyMobile(cdp) {
  // 390 is the canonical narrow-mobile acceptance width from the Living Universe handoff.
  await setViewport(cdp, 390, 844, 1);
  await navigate(cdp);
  const geometry = await evaluate(cdp, String.raw`(() => ({
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    shell: Boolean(document.querySelector('[data-public-universe-shell="true"]')),
    dock: Boolean(document.querySelector('[data-public-mobile-dock="true"]')) || Boolean(document.querySelector('nav[aria-label="Mobile Living Universe"]')),
  }))()`);
  invariant(geometry.shell, "390px mobile: Living Universe shell is missing.", geometry);
  invariant(geometry.scrollWidth <= geometry.innerWidth + 2, "390px mobile: horizontal overflow detected.", geometry);
  await verifyKeyboardFocus(cdp, "390px mobile", 7);
  return geometry;
}

async function verifyReducedMotion(cdp) {
  await setViewport(cdp, 1402, 1122, 1);
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await navigate(cdp);
  const motion = await evaluate(cdp, String.raw`(() => {
    const toMs = (value) => value.split(',').reduce((max, part) => {
      const token = part.trim();
      const numeric = Number.parseFloat(token) || 0;
      const ms = token.endsWith('ms') ? numeric : numeric * 1000;
      return Math.max(max, ms);
    }, 0);
    const candidate = document.querySelector('[data-public-plane-lens="true"] button') || document.querySelector('[data-public-universe-shell="true"] button');
    return {
      preferred: matchMedia('(prefers-reduced-motion: reduce)').matches,
      transitionDuration: candidate ? getComputedStyle(candidate).transitionDuration : null,
      transitionMs: candidate ? toMs(getComputedStyle(candidate).transitionDuration) : null,
    };
  })()`);
  invariant(motion.preferred, "prefers-reduced-motion emulation did not reach the page.", motion);
  invariant(typeof motion.transitionMs === "number" && motion.transitionMs <= 1, "Reduced-motion CSS did not collapse transitions to a negligible duration.", motion);
  return motion;
}

async function verifyRecomposition(cdp) {
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  await setViewport(cdp, 1402, 1122, 1);
  await navigate(cdp);

  const before = await evaluate(cdp, String.raw`(() => ({
    stage: Boolean(document.querySelector('[data-public-object-stage="true"]')),
    inspector: Boolean(document.querySelector('[data-public-inspector="true"]')),
    dock: Boolean(document.querySelector('[data-public-action-dock="true"]')),
    featured: document.querySelectorAll('[data-public-object-row="true"] button').length,
  }))()`);
  invariant(before.stage && before.inspector && before.dock && before.featured > 0, "Living Universe primitives are missing before recomposition.", before);

  const clicked = await evaluate(cdp, String.raw`(() => {
    const button = document.querySelector('[data-public-object-row="true"] button:not(:disabled)');
    if (!button) return false;
    button.click();
    return true;
  })()`);
  invariant(clicked, "No governed public action was available to drive recomposition.");

  await waitUntil(
    cdp,
    "Boolean(document.querySelector('[data-living-edge=\"active-path\"]')) && document.body.textContent.includes('The universe is recomposing.')",
    "action-driven Living Universe recomposition",
    20_000,
  );

  const after = await evaluate(cdp, String.raw`(() => ({
    stage: Boolean(document.querySelector('[data-public-object-stage="true"]')),
    inspector: Boolean(document.querySelector('[data-public-inspector="true"]')),
    dock: Boolean(document.querySelector('[data-public-action-dock="true"]')),
    path: Boolean(document.querySelector('[data-living-edge="active-path"]')),
    objectStage: Boolean(document.querySelector('[data-object-stage="true"]')),
    actionDock: Boolean(document.querySelector('footer[aria-label="Action dock"]')),
    stageText: document.querySelector('[data-object-stage="true"]')?.textContent?.replace(/\s+/g, ' ').trim().slice(0, 160) ?? null,
  }))()`);
  invariant(after.stage && after.inspector && after.dock && after.path && after.objectStage && after.actionDock, "Action-driven recomposition did not preserve Object Stage / Inspector / Action Dock continuity.", after);
  return after;
}

const chrome = await findChrome();
const userDataDir = await mkdtemp(join(tmpdir(), "klinikos-browser-gate-"));
const stderrBuffer = { text: "" };
const chromeProcess = spawn(chrome, [
  "--headless=new",
  "--no-sandbox",
  "--disable-gpu",
  "--disable-dev-shm-usage",
  "--remote-debugging-port=0",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
chromeProcess.stderr.setEncoding("utf8");
chromeProcess.stderr.on("data", (chunk) => {
  stderrBuffer.text += chunk;
});

let cdp;
try {
  const browserSocketUrl = await waitForDevTools(stderrBuffer);
  const port = new URL(browserSocketUrl).port;
  const pageSocketUrl = await waitForPageTarget(port);
  cdp = new CdpConnection(pageSocketUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  await setViewport(cdp, 1440, 1000, 1);
  await navigate(cdp);
  const desktopFocus = await verifyKeyboardFocus(cdp, "desktop", 8);
  const mobile = await verifyMobile(cdp);
  const reducedMotion = await verifyReducedMotion(cdp);
  const recomposition = await verifyRecomposition(cdp);

  console.log(JSON.stringify({
    status: "passed",
    chrome,
    baseUrl,
    checks: {
      desktopKeyboardFocusStops: desktopFocus.length,
      mobile,
      reducedMotion,
      recomposition,
    },
  }, null, 2));
} finally {
  cdp?.close();
  chromeProcess.kill("SIGTERM");
  await rm(userDataDir, { recursive: true, force: true });
}
