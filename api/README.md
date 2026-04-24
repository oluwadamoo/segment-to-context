# API

This service handles tenant authentication, event ingestion, persona generation orchestration, and realtime streaming.

It runs as two processes:

- `api` - public HTTP API and SSE endpoints
- `processor` - background worker for raw event persistence and persona refresh

## Responsibilities

- tenant signup and login
- JWT-based dashboard authentication
- API key based SDK ingestion
- raw event publishing to Pub/Sub
- event persistence
- user persona generation
- realtime event and persona streaming

## Local Setup

From [api](https://github.com/oluwadamoo/segment-to-context/tree/main/api):

```bash
npm install
npm run dev
```

This starts:

- Postgres via Docker
- API service on `http://localhost:5300`
- Processor service on `http://localhost:5301`

If you only want the database:

```bash
npm run dev:db
```

## Scripts

```bash
npm run dev
npm run build
npm run start:api
npm run start:processor
npm run test
npm run migration:run
```

## Environment Variables

The service expects these variables:

```env
PORT=5300

DB_HOST=localhost
DB_PORT=5436
DB_USER=db_user
DB_PASSWORD=db_password
DB_NAME=your_db_name


GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
RAW_EVENTS_TOPIC=your_pubsub_event_topic
PERSONA_REFRESH_TOPIC=your_pubsub_persona_refresh_topic

PUBSUB_PUSH_AUTH_ENABLED=true
PUBSUB_PUSH_AUDIENCE=https://your-processor-url
PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL=your_service_account_email


JWT_SECRET=your-long-random-secret
JWT_EXPIRES_IN=24h

TENANT_EVENTS_CHANNEL=tenant_events_stream
USER_PERSONAS_CHANNEL=user_personas_stream
```

## API Endpoints

### Health

`GET /health`

Simple health check.

### Auth

`POST /api/v1/auth/signup`

Creates a tenant account.

Request:

```json
{
  "email": "tenant@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "status": "success",
  "data": {
    "tenant": {
      "id": "tenant-id",
      "email": "tenant@example.com",
      "createdAt": "2026-04-23T10:00:00.000Z",
      "updatedAt": "2026-04-23T10:00:00.000Z"
    },
    "apiKey": "stc_xxxxx",
    "accessToken": "jwt-token"
  }
}
```

`POST /api/v1/auth/login`

Logs a tenant in with email and password.

Request:

```json
{
  "email": "tenant@example.com",
  "password": "password123"
}
```

`POST /api/v1/auth/rotate-api-key`

Rotates/regenerates the tenant API key.

Headers:

```http
Authorization: Bearer <jwt>
```

## Event Ingestion

### Tenant-authenticated route

`POST /api/v1/events`

Headers:

```http
Authorization: Bearer <jwt>
Content-Type: application/json
```

Body:

```json
{
  "id": "9f83b889-7486-406e-8271-9f1c7d99ab39",
  "userId": "user-42",
  "eventType": "page_view",
  "payload": {
    "page": "/product/123",
    "referrer": "https://www.market.com/",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "product":"Apple Wristwatch"
  }
}
```

### SDK route

`POST /api/v1/sdk/events`

Headers:

```http
x-api-key: <tenant-api-key>
Content-Type: application/json
```

Body shape is the same as `/api/v1/events`.

## Personas

`GET /api/v1/personas/:userId`

Returns the latest persona for a user under the authenticated tenant.

Headers:

```http
Authorization: Bearer <jwt>
```

## Realtime Streams

`GET /api/v1/stream/events`

Streams live tenant events over SSE.

`GET /api/v1/stream/personas/:userId`

Streams persona snapshot and updates for one user over SSE.

Both routes require:

```http
Authorization: Bearer <jwt>
Accept: text/event-stream
```

## Architecture Notes

- Pub/Sub is the event backbone.
- Postgres is the source of truth.
- Duplicate raw events are prevented by event ID at the database layer.
- Persona generation is eventually consistent.
- Realtime updates are pushed through SSE using Postgres-backed fan-out.

## Testing

Run:

```bash
npm test
```

The current tests focus on:

- auth use-cases
- auth controller and middleware
- event ingestion flow
- persona refresh flow
- realtime controller behavior

## Deployment

The intended deployment target is Google Cloud Run:

- one Cloud Run service for the API
- one Cloud Run service for the processor
- Postgres / Cloud SQL for data
- Pub/Sub for async messaging

Keep deployment config separate from local development. The application is already structured for that split.
