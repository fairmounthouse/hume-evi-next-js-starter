# New File Request: landing-site (separate marketing app)

- Purpose: Extract marketing landing pages into a standalone Next.js app for separate Vercel deployment.
- Location: `landing-site/` at repo root.

## Duplicate Functionality Search
- Searched for existing separate marketing/landing app: none present.
- Reused visual components from `components/landing/*` by creating standalone copies (no Clerk, no app deps) or simplified equivalents.
- Created local `components/ui/button.tsx` and `utils/index.ts` because originals depended on `@/utils` path aliases from the main app.
- Copied `public/grid.svg` locally for background art.

## New Files Added
- `landing-site/package.json`: independent scripts and deps.
- `landing-site/tsconfig.json`: local path aliases for `utils` and `components`.
- `landing-site/next.config.ts`
- `landing-site/postcss.config.mjs`
- `landing-site/app/layout.tsx`, `landing-site/app/page.tsx`, `landing-site/app/globals.css`
- `landing-site/components/ui/button.tsx`
- `landing-site/components/landing/{Hero,Problem,Solution,Transformation,Results,Footer}.tsx`
- `landing-site/utils/index.ts`
- `landing-site/public/grid.svg`
- `landing-site/README.md`

## Notes
- All CTAs point to `${NEXT_PUBLIC_APP_URL}` (set in Vercel) for sign-in/signup and dashboard.
- No Clerk provider or middleware in this app; it only links to the app subdomain.
- Styles simplified to avoid main app theme dependencies.
