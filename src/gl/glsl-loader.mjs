// Webpack/Turbopack loader: resolves #include directives in GLSL files.
// Resolution order: relative to the shader → src/gl/glsl/ → src/gl/glsl/generated/
// Webpack injects `this.resourcePath`; Turbopack may not — falls back to GL dirs only.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GL_GLSL = join(__dirname, 'glsl');
const GL_GLSL_GEN = join(__dirname, 'glsl', 'generated');

function resolveIncludes(src, filePath, seen = new Set()) {
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
    const sub = readFileSync(found, 'utf8');
    return resolveIncludes(sub, found, new Set(seen));
  });
}

export default function glslLoader(source) {
  // `this` is the webpack loader context; resourcePath is available in webpack.
  // Turbopack may call without a context; use optional chaining for safety.
  const filePath = this?.resourcePath ?? '';
  const resolved = resolveIncludes(source, filePath);
  return `export default ${JSON.stringify(resolved)};\n`;
}
