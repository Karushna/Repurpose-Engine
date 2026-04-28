import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createBufferPost, getAllChannelsForUser } from "@/lib/buffer";
import { getCurrentUserId } from "@/lib/auth";
import { getDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const requestSchema = z
  .object({
    channelId: z.string().min(1, "channelId is required"),
    text: z.string().min(1, "text is required").max(5000, "text is too long"),
    publishMode: z.enum(["queue", "schedule"]),
    scheduledAt: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.publishMode === "schedule") {
      if (!data.scheduledAt || data.scheduledAt.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "scheduledAt is required for scheduled posts",
          path: ["scheduledAt"],
        });
        return;
      }

      const parsedDate = new Date(data.scheduledAt);
      if (Number.isNaN(parsedDate.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "scheduledAt must be a valid date",
          path: ["scheduledAt"],
        });
      }
    }
  });

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "You must be logged in to publish" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Invalid request",
        },
        { status: 400 }
      );
    }

    const { channelId, text, publishMode, scheduledAt } = parsed.data;

    const mode =
      publishMode === "schedule" ? "customScheduled" : "addToQueue";

    const dueAt =
      publishMode === "schedule"
        ? new Date(scheduledAt!).toISOString()
        : undefined;

    const { channels } = await getAllChannelsForUser(userId);
    const channel = channels.find((item) => item.id === channelId);

    if (!channel) {
      return NextResponse.json(
        {
          success: false,
          error: "Selected Buffer channel is not available for this user",
        },
        { status: 403 }
      );
    }

    const post = await createBufferPost({
      userId,
      channelId,
      text,
      mode,
      dueAt,
    });

    await getDb().collection("publishLogs").add({
      userId,
      channelId,
      organizationId: channel.organizationId,
      text,
      publishMode,
      dueAt: dueAt ?? null,
      bufferPostId: post.id,
      bufferChannelId: post.channelId,
      bufferPostText: post.text,
      bufferDueAt: post.dueAt ?? null,
      status: "success",
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error("Publish route error:", error);

    try {
      const userId = await getCurrentUserId(req);
      await getDb().collection("publishLogs").add({
        userId: userId ?? null,
        status: "failed",
        error: error instanceof Error ? error.message : "Failed to publish post",
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (logError) {
      console.error("Failed to write publish log:", logError);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to publish post",
      },
      { status: 500 }
    );
  }
}
