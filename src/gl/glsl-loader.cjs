/* eslint-disable @typescript-eslint/no-require-imports */
// Webpack/Turbopack loader: resolves #include directives in GLSL files.
// Must be CJS — Turbopack's loader runner calls require() on the loader file.
// Resolution order: relative to the shader → src/gl/glsl/ → src/gl/glsl/generated/
const { readFileSync, existsSync } = require('node:fs');
const { dirname, join } = require('node:path');

const GL_GLSL = join(__dirname, 'glsl');
const GL_GLSL_GEN = join(__dirname, 'glsl', 'generated');

function resolveIncludes(src, filePath, seen = new Set(), addDep = () => {}) {
  if (seen.has(filePath)) throw new Error(`#include cycle at ${filePath}`);
  seen.add(filePath);
  return src.replace(/^\s*#include\s+"([^"]+)"/gm, (_, inc) => {
    const candidates = [
      ...(filePath ? [join(dirname(filePath), inc)] : []),
      join(GL_GLSL, inc),
      join(GL_GLSL_GEN, inc),
    ];
    const found = candidates.find(existsSync);
    if (!found) {
      throw new Error(
        `Cannot resolve #include "${inc}"${filePath ? ` from ${filePath}` : ''}. ` +
        `Looked in: ${filePath ? 'shader dir, ' : ''}src/gl/glsl/, src/gl/glsl/generated/`,
      );
    }
    addDep(found); // Tell webpack/Turbopack to watch included files for changes
    const sub = readFileSync(found, 'utf8');
    return resolveIncludes(sub, found, new Set(seen), addDep);
  });
}

module.exports = function glslLoader(source) {
  const filePath = this?.resourcePath ?? '';
  const addDep = this?.addDependency?.bind(this) ?? (() => {});
  const resolved = resolveIncludes(source, filePath, new Set(), addDep);
  return `export default ${JSON.stringify(resolved)};\n`;
};
