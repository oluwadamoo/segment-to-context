export type PushEnvelope = {
    message?: {
        data?: string;
        messageId?: string;
        attributes?: Record<string, string>;
    };
    subscription?: string;
    deliveryAttempt?: number;
}

export function decodePushMessage<T>(body: PushEnvelope): T {
    const encoded = body.message?.data;
    if (!encoded) {
        throw new Error("Invalid Pub/Sub push body");
    }

    const json = Buffer.from(encoded, "base64").toString("utf8");
    return JSON.parse(json) as T;
}


export function userOrderingKey(input: { tenantId: string; userId: string }) {
    return `${input.tenantId}:${input.userId}`;
}
