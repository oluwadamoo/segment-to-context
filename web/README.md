# Web

This is the tenant dashboard for Segment to Context.

It is a Next.js app built with:

- React
- Tailwind CSS
- shadcn/ui
- Framer Motion

## What It Does

- signup and login for tenants
- persistent dashboard auth in the browser
- live event stream
- user persona viewer
- SSE proxying through Next.js routes

## Local Setup

From [web](https://github.com/oluwadamoo/segment-to-context/tree/main/web):

```bash
npm install
npm run dev
```

The app runs on:

- `http://localhost:3000`

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Environment Variables

The app uses the API through internal route handlers and browser requests.

<!-- Set one of these when needed: -->

```env
API_BASE_URL=http://localhost:5300
```

## Project Structure

- `app/` - App Router pages and API routes
- `components/` - UI and page-level components
- `providers/` - global providers, including auth
- `lib/` - API utilities, auth helpers, dashboard helpers

Important files:

- [app/page.tsx](https://github.com/oluwadamoo/segment-to-context/tree/main/web/app/page.tsx)
- [components/home/dashboard.tsx](https://github.com/oluwadamoo/segment-to-context/tree/main/web/components/home/dashboard.tsx)
- [providers/auth-provider.tsx](https://github.com/oluwadamoo/segment-to-context/tree/main/web/providers/auth-provider.tsx)
- [app/api/stream/events/route.ts](https://github.com/oluwadamoo/segment-to-context/tree/main/web/app/api/stream/events/route.ts)

## Auth Flow

- signup and login happen through Next.js route handlers under `app/api/auth/*`
- the browser stores the session locally
- refresh keeps the tenant signed in
- logout clears the local session

## Realtime Flow

- the dashboard opens a live event stream
- Next.js proxies the SSE request to the backend API
- the UI buffers new events when paused
- the stream is capped to avoid DOM bloat

## Deployment

The intended deployment target is Vercel.

In a monorepo, deploy only this folder by setting:

- **Root Directory** = `web`

That keeps the deployment isolated from `api/` and `browser-sdk/`.

Website available at: [https://segment-to-context-web.vercel.app/](https://segment-to-context-web.vercel.app/)
