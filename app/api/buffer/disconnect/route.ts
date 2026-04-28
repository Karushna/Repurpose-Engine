import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { deleteBufferConnection } from "@/lib/buffer";

export async function POST(req: NextRequest) {
  try {
    const userId = getCurrentUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to disconnect Buffer" },
        { status: 401 }
      );
    }

    await deleteBufferConnection(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Buffer disconnect route error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to disconnect Buffer",
      },
      { status: 500 }
    );
  }
}
