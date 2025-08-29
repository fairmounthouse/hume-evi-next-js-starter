# New File Request: LANDING_COPY.md

- Purpose: Centralize all user-facing copy from the marketing landing pages for review/editing.
- Location: Project root (`LANDING_COPY.md`).

## Duplicate Functionality Search

- Searched for existing copy inventories or content maps across repo: looked for files named `COPY.md`, `CONTENT.md`, `LANDING_COPY`, `copy`, and `content` in docs—none found.
- Reviewed marketing components in both implementations:
  - `landing-site/components/*` and `landing-site/app/layout.tsx`
  - `components/landing/*`
- Verified `README.md` and other docs do not already aggregate landing copy.

## Implemented File

- `LANDING_COPY.md` contains a structured inventory of all visible text from:
  - `landing-site/app/layout.tsx`
  - `landing-site/components/{Navigation,Hero,Stats,WhatWeOffer,WhoWeBuiltFor,Testimonials,Pricing,Team,Footer}.tsx`
  - `components/landing/{Hero,Problem,Solution,Results,Transformation,Footer,FooterNewsletter}.tsx`
- For each, it lists section titles, taglines, bullets, quotes, plan names/prices, CTAs, and notable UI labels.
