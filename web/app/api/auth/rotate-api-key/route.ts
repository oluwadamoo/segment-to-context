import { NextResponse } from "next/server";

const apiBaseUrl = process.env.API_BASE_URL;

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");

    if (!authorization) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing authorization header",
        },
        { status: 401 }
      );
    }

    const response = await fetch(`${apiBaseUrl}/api/v1/auth/rotate-api-key`, {
      method: "POST",
      headers: {
        Authorization: authorization,
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
        message: "Unable to reach the API right now",
      },
      { status: 502 }
    );
  }
}
