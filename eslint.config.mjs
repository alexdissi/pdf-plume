import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),

  // Project-specific rules
  {
    rules: {
      // Code quality
      eqeqeq: ["error", "smart"],
      "no-debugger": "error",
      "no-duplicate-imports": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],

      // Prefer modern JS/TS
      "prefer-const": "warn",

      // Keep imports clean (TypeScript-aware unused vars handled by next/typescript config)
      "no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
