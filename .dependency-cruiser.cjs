/** Layer rules. See docs/ARCHITECTURE.md#layer-rules. Each `comment` is shown to the agent on violation. */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular import. Move the shared piece down into the lower layer (tokens → motion → components → sections).',
      from: {},
      to: { circular: true },
    },
    {
      name: 'tokens-are-leaves',
      severity: 'error',
      comment: 'src/tokens/generated imports nothing from src. It is generated from tokens/*.json.',
      from: { path: '^src/tokens' },
      to: { path: '^src/(?!tokens)' },
    },
    {
      name: 'motion-layer',
      severity: 'error',
      comment: 'src/motion may import only src/tokens. Pass anything else in as an argument.',
      from: { path: '^src/motion' },
      to: { path: '^src/(?!motion|tokens)' },
    },
    {
      name: 'gl-layer',
      severity: 'error',
      comment: 'src/gl may import only src/tokens and src/motion. Scenes receive data from sections through props/uniforms.',
      from: { path: '^src/gl' },
      to: { path: '^src/(components|sections|app|content)' },
    },
    {
      name: 'components-layer',
      severity: 'error',
      comment: 'src/components may import only src/tokens and src/motion. Compose gl scenes and content in src/sections.',
      from: { path: '^src/components' },
      to: { path: '^src/(gl|sections|app|content)' },
    },
    {
      name: 'sections-layer',
      severity: 'error',
      comment: 'src/sections must not import routes (src/app). Move shared code into components or sections.',
      from: { path: '^src/sections' },
      to: { path: '^src/app' },
    },
    {
      name: 'content-has-no-ui',
      severity: 'error',
      comment: 'src/content is data + zod schemas only. UI reads content, never the reverse.',
      from: { path: '^src/content' },
      to: { path: '^src/(components|sections|gl|motion|app)' },
    },
    {
      name: 'lab-is-isolated',
      severity: 'error',
      comment: 'Production code must not import lab code (src/app/lab). Promote what you need into src/motion, src/gl or src/components once its ADR is accepted.',
      from: { path: '^src/(?!app/lab)' },
      to: { path: '^src/app/lab' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)\\.next/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default', 'types'] },
  },
};
