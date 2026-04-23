import { VertexAI } from "@google-cloud/vertexai";
import { env } from "../../../config/env";
import type { PersonaModelPort } from "../../../modules/persona/application/ports/persona-model.port";
import type { StoredEvent } from "../../../modules/events/domain/event";
import type { PersonaProfile } from "../../../modules/persona/domain/persona";

export class VertexAiPersonaModel implements PersonaModelPort {
    private readonly model;

    constructor() {
        const vertex = new VertexAI({
            project: env.GCP_PROJECT_ID,
            location: env.GCP_LOCATION,
        });

        this.model = vertex.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            },
        });
    }

    async generateFromEvents(events: StoredEvent[]): Promise<PersonaProfile> {
        const prompt = [
            "Analyze the following user events and return ONLY valid JSON.",
            "Schema:",
            JSON.stringify({
                personaType: "string",
                engagementScore: 50,
                keyInterests: ["string"],
                recommendedAction: "string",
            }),
            "Events:",
            JSON.stringify(
                events.map((event) => ({
                    eventType: event.eventType,
                    payload: event.payload,
                    createdAt: event.createdAt,
                })),
            ),
        ].join("\n");

        const response = await this.withRetry(async () => {
            const result = await this.model.generateContent(prompt);
            const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new Error("Empty response from Vertex AI");
            }
            return text;
        });

        const parsed = JSON.parse(response) as PersonaProfile;
        return parsed;
    }

    private async withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
        for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
            try {
                return await operation();
            } catch (error: any) {
                const status = error?.status ?? error?.code;
                const retryable = status === 429 || status >= 500;
                if (!retryable || attempt === maxRetries) {
                    throw error;
                }

                const delay = 1000 * 2 ** attempt + Math.round(Math.random() * 300);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw new Error("Unreachable");
    }
}
