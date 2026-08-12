// Vitest-only stand-in for Next.js's compile-time `server-only` marker.
// Production imports remain unchanged; this file exists solely so Node/Vite tests can
// execute server modules without installing or weakening the application boundary.
export {};
