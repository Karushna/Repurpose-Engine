export function buildRepurposingPrompt(content: string): string {
  return `
You are a social media repurposing assistant.

Convert the source content into:
1. One LinkedIn post
2. One X post
3. One Instagram caption

Rules:
- Make each output native to the platform
- Do not invent facts
- Focus on the strongest insight from the source
- Keep the writing concise and usable
- Return valid JSON only
- Use this exact JSON shape:
{
  "linkedin": "string",
  "xPost": "string",
  "instagram": "string"
}

Source content:
"""${content}"""
`;
}