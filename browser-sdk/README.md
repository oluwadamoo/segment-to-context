# @mrdamilola/segment-to-context-browser-sdk

Lightweight browser SDK for sending user activity events to the Segment to Context API.

## Install

```bash
npm install @mrdamilola/segment-to-context-browser-sdk
```

## Quick Start

```ts
import { createSegmentToContextClient } from "@mrdamilola/segment-to-context-browser-sdk";

const stc = createSegmentToContextClient({
  apiKey: "tenant_public_api_key",
  userId: "user-42",
  debug: true,
  autoTrack: {
    pageViews: true,
    sessions: true,
    buttonClicks: true,
    linkClicks: false
  }
});

await stc.track("purchase", {
  product: "Apple Wristwatch",
  category: "electronics.tablet",
  brand: "Apple",
  price: 162.01
});
```

## What The SDK Handles

### Automatic tracking

Depending on configuration, the SDK can send:

- `page_view`
- `session_started`
- `session_ended`
- `button_click`
- `link_click`

### Manual tracking

Use manual tracking for business-specific events such as:

- `purchase`
- `checkout_started`
- `add_to_cart`
- `signup_completed`

## Browser Context Added To Events

Each event is enriched with useful browser and page context, including:

- current URL
- path
- page title
- referrer
- language
- platform
- user agent
- viewport size
- screen size
- session ID
- timestamp

## Configuration

```ts
type SegmentToContextClientOptions = {
  apiKey: string;
  apiBaseUrl?: string;
  userId?: string;
  maxRetries?: number;
  debug?: boolean;
  autoTrack?: {
    pageViews?: boolean;
    sessions?: boolean;
    buttonClicks?: boolean;
    linkClicks?: boolean;
  };
};
```

## API Integration

The SDK sends events to:

```http
POST /api/v1/sdk/events
```

Headers:

```http
x-api-key: <tenant-api-key>
Content-Type: application/json
```

## Important Notes

- event IDs are generated client-side
- the same event ID is kept across retries
- anonymous users are supported before `identify()` is called
- API key auth is scoped to SDK ingestion, not dashboard login

## Local Development

From [browser-sdk](https://github.com/oluwadamoo/segment-to-context/tree/main/browser-sdk):

```bash
npm install
npm run build
npm run typecheck
```
