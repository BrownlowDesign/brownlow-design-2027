#!/usr/bin/env node
// Compiles every shader under src/gl in headless WebGL2, the way three.js ShaderMaterial would.
// Resolves #include "file.glsl" relative to the shader, then src/gl/glsl/, then src/gl/glsl/generated/.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { ROOT, emit, launchBrowser } from './lib/harness.mjs';

const GL_ROOT = join(ROOT, 'src', 'gl');
if (!existsSync(GL_ROOT)) emit({ tool: 'shaders', status: 'pass', summary: 'No src/gl yet.' });

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'node_modules' ? [] : walk(p);
    return /\.(vert|frag)$/.test(name) ? [p] : [];
  });
}

function resolveIncludes(file, seen = new Set()) {
  if (seen.has(file)) throw new Error(`Include cycle at ${relative(ROOT, file)}`);
  seen.add(file);
  const lines = readFileSync(file, 'utf8').split('\n');
  const out = [];
  const map = []; // output line -> [file, line]
  lines.forEach((line, i) => {
    const m = line.match(/^\s*#include\s+"([^"]+)"/);
    if (!m) { out.push(line); map.push([file, i + 1]); return; }
    const candidates = [join(dirname(file), m[1]), join(GL_ROOT, 'glsl', m[1]), join(GL_ROOT, 'glsl', 'generated', m[1])];
    const hit = candidates.find(existsSync);
    if (!hit) throw new Error(`${relative(ROOT, file)}:${i + 1} cannot resolve #include "${m[1]}" (looked in shader dir, src/gl/glsl, src/gl/glsl/generated)`);
    const inc = resolveIncludes(hit, new Set(seen));
    out.push(...inc.out); map.push(...inc.map);
  });
  return { out, map };
}

// Mirrors three.js WebGL2 ShaderMaterial prefixes so authored shaders compile identically.
const VERT_PRELUDE = `#version 300 es
#define attribute in
#define varying out
#define texture2D texture
precision highp float;
precision highp int;
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
in vec3 position;
in vec3 normal;
in vec2 uv;
`;
const FRAG_PRELUDE = `#version 300 es
#define varying in
layout(location = 0) out highp vec4 pc_fragColor;
#define gl_FragColor pc_fragColor
#define texture2D texture
precision highp float;
precision highp int;
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
uniform bool isOrthographic;
`;

const files = walk(GL_ROOT);
if (!files.length) emit({ tool: 'shaders', status: 'pass', summary: 'No .vert/.frag files yet.' });

const sources = [];
const errors = [];
for (const f of files) {
  try {
    const { out, map } = resolveIncludes(f);
    const isVert = f.endsWith('.vert');
    const prelude = isVert ? VERT_PRELUDE : FRAG_PRELUDE;
    sources.push({ file: relative(ROOT, f), type: isVert ? 'vert' : 'frag', src: prelude + out.join('\n'), preludeLines: prelude.split('\n').length - 1, map: map.map(([mf, ml]) => [relative(ROOT, mf), ml]) });
  } catch (e) {
    errors.push(e.message);
  }
}

const browser = await launchBrowser('shaders');
try {
  const page = await browser.newPage();
  const results = await page.evaluate((shaders) => {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return { noGL: true };
    return shaders.map((s) => {
      const sh = gl.createShader(s.type === 'vert' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER);
      gl.shaderSource(sh, s.src);
      gl.compileShader(sh);
      const ok = gl.getShaderParameter(sh, gl.COMPILE_STATUS);
      return { file: s.file, ok, log: ok ? '' : gl.getShaderInfoLog(sh) };
    });
  }, sources.map(({ file, type, src }) => ({ file, type, src })));

  if (results.noGL) emit({ tool: 'shaders', status: 'fail', summary: 'Headless Chromium has no WebGL2.', hint: 'Run `pnpm exec playwright install chromium`. In CI use the Playwright image.' });

  for (const r of results) {
    if (r.ok) continue;
    const s = sources.find((x) => x.file === r.file);
    // Map "ERROR: 0:LINE:" back to the original file + line
    const mapped = r.log.replace(/ERROR:\s*\d+:(\d+):/g, (_, n) => {
      const idx = Number(n) - 1 - s.preludeLines;
      const loc = s.map[idx];
      return loc ? `ERROR ${loc[0]}:${loc[1]}:` : `ERROR (prelude line ${n}):`;
    });
    errors.push(mapped.replace(/\0/g, '').trim());
  }

  emit({
    tool: 'shaders',
    status: errors.length ? 'fail' : 'pass',
    summary: errors.length ? errors.join('\n') : `${sources.length} shaders compiled.`,
    hint: errors.length ? 'Fix at the file:line shown. Built-ins (position, uv, normal, modelViewMatrix, projectionMatrix…) are predeclared — don\'t redeclare them. Design constants come from tokens.glsl.' : 'OK',
  });
} finally {
  await browser.close();
}
