import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mediaUrl = searchParams.get("url");
    const filename = searchParams.get("filename") || "tiktok-download.mp4";
    const isAudio = searchParams.get("audio") === "true";

    if (!mediaUrl) {
      return NextResponse.json(
        { error: "Media URL is required" },
        { status: 400 }
      );
    }

    const response = await fetch(mediaUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch media from source (Status ${response.status})` },
        { status: 502 }
      );
    }

    const contentType = isAudio
      ? "audio/mpeg"
      : response.headers.get("content-type") || "video/mp4";

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(filename)}"`);
    headers.set("Content-Type", contentType);

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Video proxy error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while proxying the media download" },
      { status: 500 }
    );
  }
}
