import type { NextFunction, Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { env } from "../../../../config/env";

const oauthClient = new OAuth2Client();

export async function verifyPubSubPushAuth(req: Request, res: Response, next: NextFunction) {

    if (!env.PUBSUB_PUSH_AUTH_ENABLED) {
        return next();
    }

    try {
        const authorizationHeader = req.header("authorization");

        if (!authorizationHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                status: "error",
                message: "Missing bearer token",
            });
        }


        const idToken = authorizationHeader.slice("Bearer ".length);

        const ticket = await oauthClient.verifyIdToken({
            idToken,
            audience: env.PUBSUB_PUSH_AUDIENCE,
        });


        const payload = ticket.getPayload();

        if (!payload?.email || payload.email !== env.PUBSUB_PUSH_SERVICE_ACCOUNT_EMAIL) {
            return res.status(403).json({
                status: "error",
                message: "Invalid Pub/Sub caller",
            });
        }

        return next();
    } catch (e) {
        console.log(e, "VERIFICATION ERROR...")
        return res.status(401).json({
            status: "error",
            message: "Invalid OIDC token",
        });
    }
}
