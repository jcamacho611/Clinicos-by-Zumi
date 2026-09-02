import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { attachBrowserPageTarget } from "./frontend-browser-target.mjs";

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
  // Markers also exist on the previous document, so start listening before navigation
  // and require the new document's load event before polling stable hydrated state.
  const loaded = cdp.waitForEvent("Page.loadEventFired", sessionId);
  const navigation = await command("Page.navigate", { url: `${baseUrl}/` });
  if (navigation.errorText) throw new Error(`Page.navigate failed: ${navigation.errorText}`);
  await loaded;
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

async function firstFoldGeometry() {
  return evaluate(`(() => {
    const row = document.querySelector('[data-public-object-row="true"]')?.getBoundingClientRect();
    const strip = document.querySelector('[data-public-lower-strip="true"]')?.getBoundingClientRect();
    const inspector = document.querySelector('#public-plane-readout-desktop')?.getBoundingClientRect();
    const wordmark = document.querySelector('[data-klinikos-approved-wordmark="true"]');
    const wordmarkRect = wordmark?.getBoundingClientRect();
    const wordmarkFrame = wordmark?.parentElement?.getBoundingClientRect();
    const visibleHeight = (rect) => rect
      ? Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
      : 0;
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      row: row ? { top: row.top, bottom: row.bottom, visibleHeight: visibleHeight(row) } : null,
      strip: strip ? { top: strip.top, bottom: strip.bottom, visibleHeight: visibleHeight(strip) } : null,
      inspector: inspector ? { top: inspector.top, bottom: inspector.bottom, visibleHeight: visibleHeight(inspector) } : null,
      wordmarkVisibleWidth: wordmarkRect?.width ?? 0,
      wordmarkFrameWidth: wordmarkFrame?.width ?? 0,
      wordmarkNaturalWidth: wordmark?.naturalWidth ?? 0,
      firstFoldOperational: Boolean(
        ((row && visibleHeight(row) >= Math.min(112, row.height))
          || (strip && visibleHeight(strip) >= 72))
        && inspector && visibleHeight(inspector) >= Math.min(140, inspector.height)
      ),
    };
  })()`);
}

function assertFirstFold(label, geometry) {
  if (!geometry.firstFoldOperational) {
    throw new Error(`${label} does not expose an operational row/strip and the Inspector in the first fold: ${JSON.stringify(geometry)}.`);
  }
  if (geometry.wordmarkNaturalWidth !== 1937 || geometry.wordmarkVisibleWidth < geometry.wordmarkFrameWidth * 0.9) {
    throw new Error(`${label} does not render the approved wordmark across its authored frame: ${JSON.stringify(geometry)}.`);
  }
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
  const attached = await attachBrowserPageTarget({
    command: (method, params, timeoutMs) => cdp.command(method, params, undefined, timeoutMs),
  });
  sessionId = attached.sessionId;
  results.browserTargetSource = attached.targetSource;
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Network.enable");

  if (isZoomEvidenceRun) {
    await navigate();
    const layoutMetrics = await command("Page.getLayoutMetrics");
    await evaluate(`(() => {
      const trigger = document.querySelector('[data-mobile-drawer="planes"]');
      trigger?.focus();
      trigger?.click();
    })()`);
    await waitFor("open plane sheet at browser zoom", `document.querySelector('[data-mobile-sheet-panel="true"]')?.getAttribute('data-state') === 'open'`);
    const zoomState = await evaluate(`(() => {
      const composer = document.querySelector('[data-public-action-dock="true"]')?.getBoundingClientRect();
      const controls = document.querySelector('nav[aria-label="Living Universe mobile controls"]')?.getBoundingClientRect();
      const desktopInspector = document.querySelector('#public-plane-readout-desktop');
      const sheet = document.querySelector('[data-mobile-sheet-panel="true"]');
      const sheetRect = sheet?.getBoundingClientRect();
      if (sheet) sheet.scrollTop = sheet.scrollHeight;
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
        zoomSheetFitsViewport: Boolean(sheetRect && sheetRect.top >= 0 && sheetRect.bottom <= window.innerHeight),
        zoomSheetScrollReachable: Boolean(sheet && sheet.scrollTop + sheet.clientHeight >= sheet.scrollHeight - 1),
        composerRect: composer ? { top: composer.top, right: composer.right, bottom: composer.bottom, left: composer.left } : null,
        controlRect: controls ? { top: controls.top, right: controls.right, bottom: controls.bottom, left: controls.left } : null,
        screenshotSurface: {
          width: Math.round(window.innerWidth * window.devicePixelRatio),
          height: Math.round(window.innerHeight * window.devicePixelRatio),
        },
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
    if (!zoomState.zoomSheetFitsViewport || !zoomState.zoomSheetScrollReachable) {
      throw new Error(`The open mobile sheet is clipped or cannot reach its final content at ${requestedZoomPercent}% browser zoom: ${JSON.stringify(zoomState)}.`);
    }
    results.zoomMethod = "verified_chrome_profile_page_zoom";
    results.requestedZoomPercent = requestedZoomPercent;
    results.metrics = zoomState;
    await evaluate(`(() => { const sheet = document.querySelector('[data-mobile-sheet-panel="true"]'); if (sheet) sheet.scrollTop = 0; })()`);
    results.screenshot = await screenshot("zoom-200-1402x1122");
    writeFileSync(join(evidenceDir, "browser-zoom-200.json"), `${JSON.stringify(results, null, 2)}\n`);
    process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
  } else {
    await setViewport(1402, 1122);
    await command("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "no-preference" }] });
    await navigate();
    results.canonicalFirstFold = await firstFoldGeometry();
    assertFirstFold("1402×1122", results.canonicalFirstFold);
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
  results.wideFirstFold = await firstFoldGeometry();
  assertFirstFold("1920×1080", results.wideFirstFold);
  results.wide = await screenshot("browser-wide-1920x1080");

  await setViewport(768, 1024);
  await navigate();
  results.tabletPortrait = await screenshot("browser-tablet-768x1024");

  // The founder's split-window capture maps to roughly 735 CSS pixels on the
  // Retina display. Prove the browser is actually using the recomposed layout
  // in that band instead of inferring it from screenshot dimensions.
  await setViewport(735, 900);
  await navigate();
  results.splitViewport = await evaluate(`(() => {
    const progressRail = document.querySelector('[aria-label="Public interface progress"]');
    const desktopInspector = document.querySelector('[data-public-inspector="true"]');
    const mobileControls = document.querySelector('nav[aria-label="Living Universe mobile controls"]');
    const isRendered = (element) => Boolean(
      element
      && element.getClientRects().length > 0
      && element.getBoundingClientRect().width > 0
      && element.getBoundingClientRect().height > 0
    );
    const state = {
      cssViewportWidth: window.innerWidth,
      responsiveMax768: matchMedia('(max-width: 768px)').matches,
      progressRailHidden: !isRendered(progressRail),
      desktopInspectorHidden: !isRendered(desktopInspector),
      mobileControlsVisible: isRendered(mobileControls),
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
    };
    return {
      ...state,
      splitViewportRecomposed: state.cssViewportWidth === 735
        && state.responsiveMax768
        && state.progressRailHidden
        && state.desktopInspectorHidden
        && state.mobileControlsVisible
        && state.noHorizontalOverflow,
    };
  })()`);
  if (!results.splitViewport.splitViewportRecomposed) {
    throw new Error(`The 735px split-window band did not use the recomposed Living Universe layout: ${JSON.stringify(results.splitViewport)}.`);
  }
  results.splitViewport.screenshot = await screenshot("browser-split-735x900");

  await setViewport(390, 844);
  await navigate();
  results.mobileClosed = await screenshot("browser-mobile-390x844-closed");
  await evaluate(`(() => {
    const trigger = document.querySelector('[data-mobile-drawer="planes"]');
    trigger?.focus();
    trigger?.click();
  })()`);
  await waitFor(
    "open mobile plane Inspector",
    `(() => {
      const target = document.querySelector('#public-plane-readout-mobile');
      return target && target.getBoundingClientRect().height > 0 && getComputedStyle(target).visibility !== 'hidden';
    })()`,
  );
  await evaluate(`Array.from(document.querySelectorAll('button[aria-controls="public-plane-readout-mobile"]')).at(-1)?.click()`);
  await waitFor("mobile Compounding Business Inspector", `document.querySelector('#public-plane-readout-mobile')?.textContent?.includes('Compounding Business')`);
  results.mobileSheet = await evaluate(`(() => {
    const shell = document.querySelector('[data-public-universe-shell="true"]');
    const sheet = document.querySelector('[data-mobile-sheet-panel="true"]');
    const overlay = document.querySelector('[data-mobile-sheet-overlay="true"]');
    const rect = sheet?.getBoundingClientRect();
    if (sheet) sheet.scrollTop = sheet.scrollHeight;
    let backgroundNode = shell;
    let backgroundIsolated = false;
    while (backgroundNode) {
      if (backgroundNode.getAttribute('aria-hidden') === 'true') {
        backgroundIsolated = true;
        break;
      }
      backgroundNode = backgroundNode.parentElement;
    }
    return {
      mobileSheetModalIsolated: backgroundIsolated,
      mobileSheetScrollReachable: Boolean(sheet && sheet.scrollTop + sheet.clientHeight >= sheet.scrollHeight - 1),
      mobileSheetFitsViewport: Boolean(rect && rect.top >= 0 && rect.bottom <= window.innerHeight),
      overlayVisible: Boolean(overlay && overlay.getBoundingClientRect().height >= window.innerHeight),
      panelBackground: sheet ? getComputedStyle(sheet).backgroundColor : null,
    };
  })()`);
  if (!results.mobileSheet.mobileSheetModalIsolated
    || !results.mobileSheet.mobileSheetScrollReachable
    || !results.mobileSheet.mobileSheetFitsViewport
    || !results.mobileSheet.overlayVisible
    || results.mobileSheet.panelBackground !== "rgb(12, 5, 7)") {
    throw new Error(`The mobile sheet does not isolate and fully occlude the Living Home: ${JSON.stringify(results.mobileSheet)}.`);
  }
  const mobileSheetFocusTrapped = await evaluate(`document.querySelector('[data-mobile-sheet-panel="true"]')?.contains(document.activeElement) === true`);
  await evaluate(`document.querySelector('button[aria-label="Close mobile controls"]')?.focus()`);
  await pressKey("Tab", "Tab", 9, 8);
  const reverseFocusTrapped = await evaluate(`document.querySelector('[data-mobile-sheet-panel="true"]')?.contains(document.activeElement) === true`);
  results.mobileSheet.mobileSheetFocusTrapped = mobileSheetFocusTrapped && reverseFocusTrapped;
  if (!results.mobileSheet.mobileSheetFocusTrapped) throw new Error("Keyboard focus escaped the open mobile sheet.");
  await evaluate(`(() => { const sheet = document.querySelector('[data-mobile-sheet-panel="true"]'); if (sheet) sheet.scrollTop = 0; })()`);
  results.mobilePlanes = await screenshot("browser-mobile-390x844-planes-open");

  await pressKey("Escape", "Escape", 27);
  await waitFor("mobile plane sheet to close with Escape", `!document.querySelector('[data-mobile-sheet-panel="true"]')`);
  results.mobileSheet.mobileSheetEscapeClosed = true;
  results.mobileSheet.mobileSheetFocusReturned = await evaluate(`document.activeElement?.matches('[data-mobile-drawer="planes"]') === true`);
  if (!results.mobileSheet.mobileSheetFocusReturned) throw new Error("Closing the mobile sheet did not return focus to its trigger.");
  await evaluate(`(() => {
    const trigger = document.querySelector('[data-mobile-drawer="start"]');
    trigger?.focus();
    trigger?.click();
  })()`);
  await waitFor(
    "single open mobile action drawer",
    `document.querySelector('[data-mobile-sheet-panel="true"]')?.getAttribute('data-mobile-sheet') === 'start'
      && document.querySelectorAll('[data-mobile-sheet-panel="true"]').length === 1`,
  );
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
