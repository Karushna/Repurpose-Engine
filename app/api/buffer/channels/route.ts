import { NextResponse } from "next/server";
import { getOrganizations, getChannels } from "@/lib/buffer";

export async function GET() {
  try {
    const organizations = await getOrganizations();

    if (!organizations.length) {
      return NextResponse.json(
        { success: false, error: "No Buffer organizations found" },
        { status: 404 }
      );
    }

    const organizationId = organizations[0].id;
    const channels = await getChannels(organizationId);

    return NextResponse.json({
      success: true,
      data: {
        organizationId,
        channels,
      },
    });
  } catch (error) {
    console.error("Buffer channels route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch Buffer channels",
      },
      { status: 500 }
    );
  }
}