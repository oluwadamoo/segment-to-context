# Segment to Context

Segment to Context is a small event-driven system for collecting user activity, generating user personas, and visualizing the results in real time.

The repository currently contains three main parts:

- `api/` - backend API and worker logic
- `web/` - tenant dashboard built with Next.js
- `browser-sdk/` - published browser SDK for event tracking

## High-Level Flow

1. A tenant signs up or logs in from the dashboard.
2. Events enter the system through either:
   - the authenticated API route, or
   - the browser SDK route using `x-api-key`
3. Raw events are published to Pub/Sub.
4. The processor persists events and triggers persona refresh work.
5. Recent user activity is sent to the LLM persona layer.
6. The latest persona is stored and pushed to the dashboard through SSE.

## Repository Structure

```text
segment-to-context/
  api/
  web/
  browser-sdk/
```

## Project Guides

- [API Guide](https://github.com/oluwadamoo/segment-to-context/tree/main/api/README.md)
- [Web Guide](https://github.com/oluwadamoo/segment-to-context/tree/main/web/README.md)
- [Browser SDK Guide](https://github.com/oluwadamoo/segment-to-context/tree/main/browser-sdk/README.md)

## Local Development

### API

From [api](https://github.com/oluwadamoo/segment-to-context/tree/main/api):

```bash
npm install
npm run dev
```

This starts:

- Postgres through Docker
- the API service
- the processor service

### Web

From [web](https://github.com/oluwadamoo/segment-to-context/tree/main/web):

```bash
npm install
npm run dev
```

The dashboard runs on `http://localhost:3000`.

### Browser SDK

From [browser-sdk](https://github.com/oluwadamoo/segment-to-context/tree/main/browser-sdk):

```bash
npm install
npm run build
```

## Deployment Direction

The current deployment split is straightforward:

- `api/` -> Google Cloud Run
- `web/` -> Vercel
- `browser-sdk/` -> npm

This works well in a monorepo because each part deploys independently while still sharing one source of truth.

## Notes

- The backend is event-driven, but the codebase is intentionally kept small and readable.
- The dashboard uses SSE for live updates.
- The SDK is designed to be useful out of the box with auto-tracking, while still allowing manual business events like `purchase` or `checkout_started`.
