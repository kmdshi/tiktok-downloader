import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const activationFilePath = path.join(
  process.cwd(),
  "src",
  "data",
  "activation.json"
);

const MAX_ACTIVATIONS = 2;

export async function POST(request: Request) {
  try {
    const { trigger } = await request.json();
    const secretTrigger = process.env.STEALTH_SECRET_TRIGGER || "beta-testing";

    if (!trigger || trigger !== secretTrigger) {
      return NextResponse.json({ error: "Invalid trigger code" }, { status: 400 });
    }

    let fileContent;
    try {
      fileContent = await fs.readFile(activationFilePath, "utf-8");
    } catch (e) {
      fileContent = JSON.stringify({ deviceTokens: [] });
    }

    const state = JSON.parse(fileContent);
    const tokens = state.deviceTokens || [];

    if (tokens.length >= MAX_ACTIVATIONS) {
      return NextResponse.json(
        { code: "LINK_CLAIMED", error: "This activation link has reached its maximum device limit." },
        { status: 403 }
      );
    }

    const token = crypto.randomBytes(32).toString("hex");

    tokens.push(token);
    const newState = {
      deviceTokens: tokens,
    };

    await fs.mkdir(path.dirname(activationFilePath), { recursive: true });
    await fs.writeFile(
      activationFilePath,
      JSON.stringify(newState, null, 2),
      "utf-8"
    );

    return NextResponse.json({ success: true, token });
  } catch (error: any) {
    console.error("Activation endpoint error:", error);
    return NextResponse.json(
      { error: "Server error during activation" },
      { status: 500 }
    );
  }
}
