# @react-three/fiber

**Installed:** ^9 (resolved at install time — check pnpm-lock.yaml for exact version)  
**Docs:** https://r3f.docs.pmnd.rs

## Key choices
- One `<Canvas>` lives in `src/gl/CanvasRoot.tsx` only (harness rule enforced).
- Sections render scenes into the shared canvas via drei `<View>` (ADR-0004, task 003).
- Do not import `@react-three/fiber` outside `src/gl/`.
