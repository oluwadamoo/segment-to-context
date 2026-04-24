import { NextRequest, NextResponse } from "next/server";

const apiBaseUrl = process.env.API_BASE_URL;

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

  const limit = request.nextUrl.searchParams.get("limit");
  const cursorCreatedAt = request.nextUrl.searchParams.get("cursorCreatedAt");
  const cursorId = request.nextUrl.searchParams.get("cursorId");
  const upstreamSearchParams = new URLSearchParams();

  if (limit) {
    upstreamSearchParams.set("limit", limit);
  }

  if (cursorCreatedAt && cursorId) {
    upstreamSearchParams.set("cursorCreatedAt", cursorCreatedAt);
    upstreamSearchParams.set("cursorId", cursorId);
  }

  const upstreamUrl = `${apiBaseUrl}/api/v1/events/history${upstreamSearchParams.size > 0 ? `?${upstreamSearchParams.toString()}` : ""}`;

  try {
    const response = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const payload = await response.json().catch(() => ({
      status: "error",
      message: "Unexpected API response",
    }));

    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        status: "error",
        message: "Unable to reach the event history right now",
      },
      { status: 502 }
    );
  }
}
