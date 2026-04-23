import { NextResponse } from "next/server";

const apiBaseUrl =
  process.env.API_BASE_URL

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
        message: "Unable to reach the API right now",
      },
      { status: 502 }
    );
  }
}
