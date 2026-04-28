import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getAllChannelsForUser, getBufferConnection } from "@/lib/buffer";

export async function GET(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, connected: false, error: "You must be logged in" },
        { status: 401 }
      );
    }

    const connection = await getBufferConnection(userId);

    if (!connection) {
      return NextResponse.json({
        success: true,
        connected: false,
        data: {
          organizations: [],
          channels: [],
        },
      });
    }

    const { organizations, channels } = await getAllChannelsForUser(userId);

    return NextResponse.json({
      success: true,
      connected: true,
      data: {
        organizations,
        channels,
      },
    });
  } catch (error) {
    console.error("Buffer channels route error:", error);

    return NextResponse.json(
      {
        success: false,
        connected: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Buffer channels",
      },
      { status: 500 }
    );
  }
}
