# Landing Site

Standalone Next.js app for the marketing landing page.

## Setup

1. Create `.env.local` with:

```
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com
```

2. Install deps and run:

```
pnpm i
pnpm dev
```

## Deploy
- Deploy this `landing-site` folder as a separate Vercel project.
- Set `NEXT_PUBLIC_APP_URL` env var in Vercel.

## Notes
- CTAs link to `${NEXT_PUBLIC_APP_URL}` for auth and dashboard.
- No Clerk or backend code in this app.
