import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const activationFilePath = path.join(
  process.cwd(),
  "src",
  "data",
  "activation.json"
);

async function validateDeviceToken(token: string | null, requestHost: string | null): Promise<boolean> {
  if (requestHost && (requestHost.startsWith("localhost") || requestHost.startsWith("127.0.0.1"))) {
    return true;
  }
  try {
    if (!token) return false;
    const fileContent = await fs.readFile(activationFilePath, "utf-8");
    const state = JSON.parse(fileContent);
    const tokens: string[] = state.deviceTokens || [];
    return tokens.includes(token);
  } catch (e) {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const deviceToken = request.headers.get("x-device-token");
    const host = request.headers.get("host");
    const isAuthorized = await validateDeviceToken(deviceToken, host);

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access Denied: Device is not authorized." },
        { status: 401 }
      );
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();
    if (
      !trimmedUrl.includes("tiktok.com") &&
      !trimmedUrl.includes("douyin.com")
    ) {
      return NextResponse.json(
        { error: "Please enter a valid TikTok or Douyin URL" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || "tiktok-video-no-watermark2.p.rapidapi.com";

    if (!apiKey || apiKey === "your_rapidapi_key_here") {
      return NextResponse.json(
        { error: "RapidAPI key is not configured on the server. Please add it to your .env file." },
        { status: 500 }
      );
    }

    const targetUrl = new URL(`https://${apiHost}/`);
    targetUrl.searchParams.append("url", trimmedUrl);
    targetUrl.searchParams.append("hd", "1");

    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": apiHost,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API responded with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.code !== 0 && data.msg) {
      return NextResponse.json(
        { error: `API error: ${data.msg}` },
        { status: 400 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Download route error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
