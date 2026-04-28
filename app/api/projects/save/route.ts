import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const requestSchema = z.object({
  sourceContent: z.string().min(1, "sourceContent is required"),
  linkedin: z.string().min(1, "linkedin is required"),
  xPost: z.string().min(1, "xPost is required"),
  instagram: z.string().min(1, "instagram is required"),
});

export async function POST(req: NextRequest) {
  try {
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

    const docRef = await getDb().collection("projects").add({
      sourceContent: parsed.data.sourceContent,
      outputs: {
        linkedin: parsed.data.linkedin,
        xPost: parsed.data.xPost,
        instagram: parsed.data.instagram,
      },
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
      },
    });
  } catch (error) {
    console.error("Save project route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to save project",
      },
      { status: 500 }
    );
  }
}
