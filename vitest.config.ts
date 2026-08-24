import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` is a Next.js compile-time boundary marker. Keep production
      // imports intact while giving Vitest an inert Node-resolvable target.
      "server-only": fileURLToPath(new URL("./tests/server-only-stub.ts", import.meta.url)),
    },
  },
  /* The app is React 19, which Next compiles with the automatic JSX runtime. Vitest's
     esbuild defaults to the classic transform, so a .tsx test that renders a component
     fails with "React is not defined" unless every such file imports React by hand.
     Matching production here keeps JSX behaving the same way in tests as it ships. */
  esbuild: { jsx: "automatic" },
  test: {
    environment: "node",
  },
});
