# System Design

## Overview

This system is built around a simple event driven flow:

1. An authenticated tenant sends an event to the API.
2. The API publishes the event to Google Pub/Sub.
3. A worker consumes the raw event, persists it, and triggers persona refresh.
4. The persona refresh flow gathers recent unprocessed events for the user, calls the LLM, updates the stored user persona, and marks those events as processed.
5. The API exposes realtime updates to the frontend through SSE.

The architecture is intentionally split into two main runtime concerns:

- **API**
  Handles authentication, event ingestion, and realtime streaming.
- **Worker**
  Handles background event processing and persona generation.

This keeps ingestion fast and user facing traffic separate from slower LLM work.

---

## N+1 Query Risks

There are no severe classic ORM relationship based N+1 problems in the current implementation, mainly because the system is still fairly flat and does not rely heavily on nested relational loading.

That said, there are still a few places where N+1 style behavior could potentially emerge.

### 1. Persona lookups per user
If the frontend starts requesting persona data for many users individually, the backend will currently issue one lookup per user. This is not a bug today because the UI is centered around a selected user, but it would become inefficient if the dashboard later expands into a list view that fetches personas for many users at once.

### 2. Realtime persona hydration
If the frontend opens multiple persona streams or repeatedly fetches persona snapshots user by user, the system could drift into a "one request per user pattern." Again, this is acceptable for the current product shape, but it would need batching if the interface expands.

### 3. Future dashboard aggregation
If I later add summary widgets such as “top users,” “top categories,” or “latest persona changes” by composing many smaller queries in the API layer, that could turn into an application level N+1 problem even without ORM joins.

### Current posture
So the short answer is:

- there is **no major N+1 issue today**
- there **is a scaling risk** if the product evolves into multi-user persona hydration without introducing batching or aggregation endpoints

If that happens, the fix would be to introduce:

- batched persona reads
- pre aggregated dashboard queries
- dedicated list endpoints instead of repeated single record fetches

---

## Horizontal Scaling on Google Cloud Run

My scaling approach is to scale the API and worker independently.

### API scaling
The API is a good fit for horizontal scaling on Cloud Run because it is mostly stateless. Its main responsibilities are:

- authenticating tenants
- accepting events
- publishing to Pub/Sub
- serving SSE connections

For horizontal scaling:

- deploy multiple API instances on Cloud Run
- keep session/auth stateless using JWT
- store persistent data only in Postgres
- rely on Pub/Sub and Postgres rather than in-memory coordination

That means any API instance can accept any tenant request.

The only area that needs extra care is SSE. Since SSE connections are long lived, API instances may hold open connections for a while. That is still fine on Cloud Run, but it means:

- connection count needs to be monitored
- instance concurrency should be tuned carefully
- SSE fan out should rely on shared infrastructure, not local memory

That is why the current design uses Postgres `LISTEN/NOTIFY` as the bridge for realtime messages. It avoids tying live updates to a single API instance.

### Worker scaling
The worker is also horizontally scalable, but with a different goal. It is not serving end user HTTP traffic. Its job is to process background work safely under retry.

Cloud Run scaling works well here because Pub/Sub naturally distributes messages across worker instances. To keep that safe:

- workers remain stateless
- deduplication is enforced at the database layer for raw events
- persona writes are done as upserts
- Pub/Sub retries are allowed when processing fails

This means more worker instances can process more user traffic without requiring shared in-memory state.

### Separation of scaling concerns
The main design principle is:

- **scale API for request volume and live connections**
- **scale worker for event throughput and LLM processing load**

That separation is important because those two workloads behave very differently.

---

## Data Consistency When the LLM Worker Fails Mid-Process

The system is designed for **eventual consistency**, not distributed transactions.

That is the right tradeoff for this kind of workflow.

### Current processing order
The worker currently does this in sequence:

1. fetch recent unprocessed events for a user
2. generate persona with the LLM
3. upsert persona into the database
4. publish realtime persona update
5. mark the contributing events as processed

### What happens if the worker fails mid-process?

#### Failure before persona generation
Nothing is committed yet.
The events remain unprocessed, so a retry can safely pick them up again.

#### Failure during LLM generation
Again, nothing has been committed.
The events remain unprocessed and are retried later.

#### Failure after persona upsert but before marking events processed
This is the most important case.

In this scenario:

- the persona may already be updated
- the events are still unprocessed
- Pub/Sub retry can cause the same events to be processed again

The system tolerates this because:

- persona writes are upserts rather than blind inserts
- recomputing the same persona is acceptable
- the system favors retry safety over perfect single execution semantics

So the tradeoff is:
- duplicate computation is possible
- data loss is avoided

That is usually the better choice for this workflow.

#### Failure after realtime publish but before marking processed
The UI may temporarily receive an update before the source events are marked processed.
If the worker retries, the persona may be recomputed and another update may be emitted.
That is acceptable under at least once delivery semantics.

### Why this is still consistent enough
The design relies on a few practical consistency principles:

- raw event persistence is deduplicated by event ID
- persona persistence is idempotent enough through upsert behavior
- unprocessed events remain retryable until the final mark-processed step succeeds
- Pub/Sub retry behavior helps recover from partial failures

So while the workflow is not transactionally perfect across all steps, it is resilient and converges toward a correct final state.

For this project, the current model is a reasonable balance between simplicity and correctness.

---

## Final Notes

The system is designed around a few core principles:

- keep the API fast and stateless
- push slow work into background processing
- rely on managed cloud primitives
- accept at least once delivery and design for safe retries
- keep the code understandable even while using an event driven architecture

That balance is what makes the design both practical for the assessment and realistic enough for production minded discussion.
