import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "zumi-server-*.js"] },
  {
    rules: {
      // The codebase already marks a deliberately-unused binding by prefixing it with an
      // underscore — a parameter kept because it is part of a caller's contract, or a
      // destructured field being dropped on purpose. Honouring that convention is what
      // lets `lint` mean "something is wrong" instead of "13 known and accepted things".
      // Nothing is silenced that is not explicitly named as intentional at its site.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default config;
