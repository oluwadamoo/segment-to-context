import type { StoredEvent } from "../../../events/domain/event";
import type { PersonaProfile } from "../../domain/persona";

export interface PersonaModelPort {
    generateFromEvents(events: StoredEvent[]): Promise<PersonaProfile>;
}
