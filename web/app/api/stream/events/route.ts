import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const apiBaseUrl =
  process.env.API_BASE_URL

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      {
        status: "error",
        message: "Missing access token",
      },
      { status: 401 }
    );
  }

  try {
    const upstreamResponse = await fetch(`${apiBaseUrl}/api/v1/stream/events`, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!upstreamResponse.ok || !upstreamResponse.body) {
      const payload = await upstreamResponse.json().catch(() => null);
      const message =
        payload &&
          typeof payload === "object" &&
          "message" in payload &&
          typeof payload.message === "string"
          ? payload.message
          : "Unable to open the live event stream";

      return NextResponse.json(
        {
          status: "error",
          message,
        },
        { status: upstreamResponse.status || 502 }
      );
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Unable to reach the live event stream right now",
      },
      { status: 502 }
    );
  }
}
