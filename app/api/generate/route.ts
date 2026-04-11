import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { openai } from "@/lib/openai";
import { buildRepurposingPrompt } from "@/lib/prompts";
import type { GenerateResponse, GeneratedPosts } from "@/lib/types";

const requestSchema = z.object({
  content: z
    .string()
    .min(50, "Content must be at least 50 characters")
    .max(12000, "Content must be under 12000 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      const response: GenerateResponse = {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid request",
      };

      return NextResponse.json(response, { status: 400 });
    }

    const prompt = buildRepurposingPrompt(parsed.data.content);

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You generate platform-native social media content.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      const response: GenerateResponse = {
        success: false,
        error: "No response from OpenAI",
      };

      return NextResponse.json(response, { status: 500 });
    }

    const parsedOutput = JSON.parse(raw) as GeneratedPosts;

    console.log("RAW OPENAI RESPONSE:", raw);
    console.log("PARSED OPENAI RESPONSE:", parsedOutput);

    if (
      typeof parsedOutput.linkedin !== "string" ||
      typeof parsedOutput.xPost !== "string" ||
      typeof parsedOutput.instagram !== "string"
    ) {
      const response: GenerateResponse = {
        success: false,
        error: "Invalid AI response shape",
      };

      return NextResponse.json(response, { status: 500 });
    }

    const response: GenerateResponse = {
      success: true,
      data: parsedOutput,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Generate route error:", error);

    const response: GenerateResponse = {
      success: false,
      error: "Failed to generate posts",
    };

    return NextResponse.json(response, { status: 500 });
  }
}