import { NextResponse } from "next/server";
import { getDb } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await getDb()
      .collection("projects")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const projects = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        sourceContent: data.sourceContent ?? "",
        outputs: data.outputs ?? null,
        createdAt: data.createdAt ?? null,
      };
    });

    return NextResponse.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error("History route error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project history",
      },
      { status: 500 }
    );
  }
}
