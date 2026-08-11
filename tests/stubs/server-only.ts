/**
 * `server-only` is a build-time guard: importing it from a client bundle is a Next.js
 * compile error. There is no bundle in a Vitest run, so the import has nothing to
 * guard and no package to resolve — this stub stands in for it.
 *
 * It intentionally does nothing. The real protection is unchanged: the alias exists
 * only in `vitest.config.ts`, so the application build still resolves the genuine
 * package and still refuses to ship server modules to the browser.
 */
export {};
