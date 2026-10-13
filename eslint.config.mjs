import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import harness from "./eslint.harness.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...harness,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/tokens/generated/**",
    "src/styles/generated/**",
    "src/gl/glsl/generated/**",
    "eslint.harness.mjs",
    "tokens/**",
    "scripts/**",
  ]),
]);

export default eslintConfig;
