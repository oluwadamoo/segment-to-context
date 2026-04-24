import { Router } from "express";
import { env } from "../config/env";
import { createApp } from "./create-app";
import { EventController } from "../modules/events/presentation/http/event.controller";
import { RawEventsPushController } from "../modules/events/presentation/http/raw-events-push.controller";
import { PersonaRefreshPushController } from "../modules/persona/presentation/http/persona-refresh-push.controller";
import { PublishRawEventUseCase } from "../modules/events/application/use-cases/publish-raw-event.use-case";
import { PersistRawEventUseCase } from "../modules/events/application/use-cases/persist-raw-event.use-case";
import { ProcessPersonaRefreshUseCase } from "../modules/persona/application/use-cases/process-persona-refresh.use-case";
import { EventRepository } from "../infrastructure/db/repositories/event.repository";
import { PersonaRepository } from "../infrastructure/db/repositories/persona.repository";
import { VertexAiPersonaModel } from "../infrastructure/ai/vertex/vertex-ai-persona-model";
import { PubSubJsonPublisher } from "../infrastructure/messaging/pubsub/pubsub-json-publisher";
import { verifyPubSubPushAuth } from "../modules/shared/presentation/http/verify-pubsub-push-auth";
import type { IngestEventDTO } from "../modules/events/domain/event";
import type { PersonaRefreshMessage } from "../modules/persona/domain/persona-refresh-message";
import { TenantRepository } from "../infrastructure/db/repositories/tenant.repository";
import { JwtTenantTokenService } from "../infrastructure/security/jwt-token-service";
import { PasswordHasher } from "../infrastructure/security/password-hasher";
import { TenantApiKeyService } from "../infrastructure/security/tenant-api-key-service";
import { TenantAuthController } from "../modules/tenants/presentation/http/tenant.auth.controller";
import { LoginTenantUseCase } from "../modules/tenants/application/use-cases/login-tenant.use-case";
import { RotateTenantApiKeyUseCase } from "../modules/tenants/application/use-cases/rotate-tenant-api-key.use-case";
import { SignupTenantUseCase } from "../modules/tenants/application/use-cases/signup-tenant.use-case";
import { requireTenantAuth } from "../modules/tenants/presentation/http/require-tenant-auth";
import { PostgresRealtimePublisher } from "../infrastructure/realtime/postgres-realtime-publisher";
// import type { RealtimeSubscriberPort } from "../modules/realtime/application/ports/realtime-subscriber.port";
// import { RealtimeController } from "../modules/realtime/presentation/http/realtime.controller";
import { GetUserPersonaUseCase } from "../modules/persona/application/use-cases/get-user-persona.use-case";
import { PersonaController } from "../modules/persona/presentation/http/persona.controller";
import { requireTenantApiKey } from "../modules/tenants/presentation/http/require-tenant-apikey";

function attachHealthRoute(router: Router) {
    router.get("/health", (_req, res) => {
        res.status(200).json({ status: "ok" });
    });
}

export function buildApiApp(
    // realtimeSubscriber: RealtimeSubscriberPort
) {
    const router = Router();
    attachHealthRoute(router);

    const tenantRepository = new TenantRepository();
    const passwordHasher = new PasswordHasher();
    const apiKeyService = new TenantApiKeyService();
    const tenantTokenService = new JwtTenantTokenService();
    const personaRepository = new PersonaRepository();

    const tenantAuthController = new TenantAuthController(
        new SignupTenantUseCase(
            tenantRepository,
            passwordHasher,
            apiKeyService,
            tenantTokenService,
        ),
        new LoginTenantUseCase(
            tenantRepository,
            passwordHasher,
            tenantTokenService,
        ),
        new RotateTenantApiKeyUseCase(
            tenantRepository,
            apiKeyService,
        ),
    );

    const rawEventsPublisher = new PubSubJsonPublisher<IngestEventDTO>(env.RAW_EVENTS_TOPIC);
    const eventController = new EventController(new PublishRawEventUseCase(rawEventsPublisher));

    const getUserPersonaUseCase = new GetUserPersonaUseCase(personaRepository);
    const personaController = new PersonaController(getUserPersonaUseCase);
    // const realtimeController = new RealtimeController(
    //     realtimeSubscriber,
    //     getUserPersonaUseCase,
    // );

    router.post("/api/v1/auth/signup", tenantAuthController.signup);
    router.post("/api/v1/auth/login", tenantAuthController.login);
    router.post(
        "/api/v1/auth/rotate-api-key",
        requireTenantAuth(tenantTokenService),
        tenantAuthController.rotateApiKey,
    );

    router.post(
        "/api/v1/events",
        requireTenantAuth(tenantTokenService),
        eventController.ingestEvent,
    );

    router.post(
        "/api/v1/sdk/events",
        requireTenantApiKey(tenantRepository, apiKeyService),
        eventController.ingestEvent,
    );


    router.get(
        "/api/v1/personas/:userId",
        requireTenantAuth(tenantTokenService),
        personaController.getByUserId,
    );

    // router.get(
    //     "/api/v1/stream/events",
    //     requireTenantAuth(tenantTokenService),
    //     realtimeController.streamTenantEvents,
    // );

    // router.get(
    //     "/api/v1/stream/personas/:userId",
    //     requireTenantAuth(tenantTokenService),
    //     realtimeController.streamUserPersona,
    // );

    return createApp(router);
}

export function buildProcessorApp() {
    const router = Router();
    attachHealthRoute(router);

    const eventRepository = new EventRepository();
    const personaRepository = new PersonaRepository();
    const personaModel = new VertexAiPersonaModel();
    const realtimePublisher = new PostgresRealtimePublisher();

    const personaRefreshPublisher = new PubSubJsonPublisher<PersonaRefreshMessage>(env.PERSONA_REFRESH_TOPIC);
    const rawEventsPushController = new RawEventsPushController(
        new PersistRawEventUseCase(
            eventRepository,
            personaRefreshPublisher,
            realtimePublisher,
        ),
    );
    const personaRefreshPushController = new PersonaRefreshPushController(
        new ProcessPersonaRefreshUseCase(
            eventRepository,
            personaRepository,
            personaModel,
            realtimePublisher,
        ),
    );

    router.post(
        "/internal/pubsub/raw-events",
        verifyPubSubPushAuth,
        rawEventsPushController.handle,
    );
    router.post(
        "/internal/pubsub/persona-refresh",
        verifyPubSubPushAuth,
        personaRefreshPushController.handle,
    );

    return createApp(router);
}
