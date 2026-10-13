// Ambient declaration so TypeScript can resolve the generated module before
// tokens:build has run. The actual file is produced by tokens/build.mjs.
declare module "*/tokens/generated/tokens.js" {
  const tokens: { [key: string]: string };
  export = tokens;
}
