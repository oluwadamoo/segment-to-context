import type { Response } from "express";

export function openSseStream(response: Response) {
    response.setHeader("Content-Type", "text/event-stream");
    response.setHeader("Cache-Control", "no-cache, no-transform");
    response.setHeader("Connection", "keep-alive");
    response.setHeader("X-Accel-Buffering", "no");

    response.flushHeaders?.();
    response.write("retry: 3000\n\n");
}

export function writeSseEvent(
    response: Response,
    input: { event: string; data: unknown },
) {
    response.write(`event: ${input.event}\n`);
    response.write(`data: ${JSON.stringify(input.data)}\n\n`);
}
