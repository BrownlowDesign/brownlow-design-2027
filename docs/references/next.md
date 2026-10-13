# Next.js

**Installed:** 16.4.0  
**Docs:** https://nextjs.org/docs

## Key choices
- App Router (not Pages Router)
- TypeScript strict mode
- Tailwind CSS v4 via `@tailwindcss/turbopack` (dev) / `@tailwindcss/postcss` (webpack)
- `src/` directory layout

## Notes
- `next-env.d.ts` is generated at dev/build time; it is gitignored.
- Lab routes gate via `src/app/lab/layout.tsx` — `notFound()` in production unless `NEXT_PUBLIC_LAB=1`.
