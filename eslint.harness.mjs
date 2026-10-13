// Harness lint rules. Spread into eslint.config.mjs AFTER the framework config:
//   import harness from './eslint.harness.mjs';
//   export default [...nextConfig, ...harness];
// Every message says what to do instead — the agent reads these directly.
// Don't weaken these. To change one, propose it in a harness-repair (Ryan approves).

const SRC = ['src/**/*.{ts,tsx,js,jsx,mjs}'];
const GENERATED = ['src/tokens/generated/**', 'src/styles/generated/**', 'src/gl/glsl/generated/**'];

const msg = {
  hex: 'Raw color. Use a semantic token: CSS `var(--color-…)`, Tailwind theme class, or `tokens.color…` from src/tokens/generated. Missing token? Add it in tokens/ (docs/TOKENS.md) — new raw values are Ryan\'s call.',
  arbitrary: 'Tailwind arbitrary value (`foo-[…]`). Use a theme class mapped to tokens. If the scale lacks the value, add a token (docs/TOKENS.md).',
  px: 'Raw px value. Use a spacing/size token (Tailwind theme class or var(--space-…)).',
  duration: 'Raw duration. Use a motion preset from src/motion/presets.ts (backed by tokens/motion.json).',
  easing: 'Raw easing. Use a motion preset from src/motion/presets.ts (backed by tokens/motion.json).',
  scrollListener: 'Direct scroll listener. Declare scroll behavior with useScrollScene() from src/motion (docs/MOTION.md#scroll-scenes).',
  scrollRead: 'Reading scroll position directly. Use useScrollScene() / the scroll engine in src/motion; harness mode depends on it.',
  canvas: 'Only src/gl/CanvasRoot.tsx renders <Canvas>. Register a scene and place it with <View> (docs/WEBGL.md#canvas).',
  time: 'Read time from the motion clock (src/motion/clock.ts): clock.now() / clock.subscribe(). Direct time breaks harness-mode determinism.',
  raf: 'Use clock.subscribe() from src/motion/clock.ts — it is the only frame loop.',
  random: 'Math.random breaks determinism in harness mode. Use the seeded random from src/motion/random.ts.',
  three: 'three / @react-three/* may only be imported inside src/gl. Sections pass data to scenes via props; see docs/WEBGL.md.',
  motionLib: 'Scroll/animation libraries may only be imported inside src/motion. Use useScrollScene(), presets, or <TransitionLink> from src/motion.',
};

const importRules = ({ allowThree = false, allowMotionLibs = false } = {}) => {
  const patterns = [];
  if (!allowThree) patterns.push({ group: ['three', 'three/*', '@react-three/*'], message: msg.three });
  if (!allowMotionLibs) patterns.push({ group: ['gsap', 'gsap/*', '@gsap/*', 'lenis', 'lenis/*', 'motion', 'motion/*', 'framer-motion'], message: msg.motionLib });
  return patterns.length ? ['error', { patterns }] : 'off';
};

const syntaxRules = ({ allowCanvas = false, allowScroll = false } = {}) => [
  'error',
  { selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]', message: msg.hex },
  { selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]', message: msg.hex },
  { selector: 'Literal[value=/(rgb|hsl|oklch)a?\\(/]', message: msg.hex },
  { selector: 'Literal[value=/(^|\\s)[a-z][a-z0-9:-]*-\\[[^\\]]+\\]/]', message: msg.arbitrary },
  { selector: 'TemplateElement[value.raw=/(^|\\s)[a-z][a-z0-9:-]*-\\[[^\\]]+\\]/]', message: msg.arbitrary },
  { selector: 'Literal[value=/^-?\\d+(\\.\\d+)?px$/]', message: msg.px },
  { selector: 'Literal[value=/^\\d+(\\.\\d+)?m?s$/]', message: msg.duration },
  { selector: 'Literal[value=/cubic-bezier\\(/]', message: msg.easing },
  { selector: 'Property[key.name=/^(duration|delay|stagger)$/] > Literal[raw=/^\\d/]', message: msg.duration },
  { selector: 'Property[key.name=/^(ease|easing)$/] > Literal', message: msg.easing },
  ...(allowScroll ? [] : [
    { selector: "CallExpression[callee.property.name='addEventListener'][arguments.0.value=/^(scroll|wheel)$/]", message: msg.scrollListener },
    { selector: "MemberExpression[object.name='window'][property.name=/^(scrollY|pageYOffset|scrollX|pageXOffset)$/]", message: msg.scrollRead },
  ]),
  ...(allowCanvas ? [] : [{ selector: "JSXOpeningElement[name.name='Canvas']", message: msg.canvas }]),
];

const timeRules = (allow) => (allow ? {
  'no-restricted-properties': 'off',
  'no-restricted-globals': 'off',
} : {
  'no-restricted-properties': ['error',
    { object: 'performance', property: 'now', message: msg.time },
    { object: 'Date', property: 'now', message: msg.time },
    { object: 'Math', property: 'random', message: msg.random },
    { object: 'window', property: 'requestAnimationFrame', message: msg.raf },
  ],
  'no-restricted-globals': ['error',
    { name: 'requestAnimationFrame', message: msg.raf },
    { name: 'cancelAnimationFrame', message: msg.raf },
  ],
});

export default [
  {
    files: SRC,
    ignores: GENERATED,
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' },
    rules: {
      'no-restricted-syntax': syntaxRules(),
      'no-restricted-imports': importRules(),
      ...timeRules(false),
    },
  },
  // src/motion owns time, rAF, scroll and animation libraries.
  {
    files: ['src/motion/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': syntaxRules({ allowScroll: true }),
      'no-restricted-imports': importRules({ allowMotionLibs: true }),
      ...timeRules(true),
    },
  },
  // src/gl owns three/R3F.
  {
    files: ['src/gl/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': importRules({ allowThree: true }),
    },
  },
  // The one canvas.
  {
    files: ['src/gl/CanvasRoot.tsx'],
    rules: {
      'no-restricted-syntax': syntaxRules({ allowCanvas: true }),
    },
  },
];
