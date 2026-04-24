# SDK Demo

Small dark-theme ecommerce demo for `@mrdamilola/segment-to-context-browser-sdk`.

## Run

```bash
cd sdk-demo
npm install
npm run dev
```

Open:

```text
http://localhost:4173
```

## What this app demonstrates

- automatic browser tracking through the published SDK
- SPA-style page transitions that should emit fresh `page_view` events
- manual commerce events for:
  - `product_view`
  - `add_to_cart`
  - `purchase`

## Notes

- paste a real tenant API key to enable tracking
- the event log in the UI shows what the app is trying to send
- the real validation should happen in your main dashboard stream

Website available at: [https://segment-to-context-sdk-demo.vercel.app/](https://segment-to-context-sdk-demo.vercel.app/)

