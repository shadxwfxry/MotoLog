import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { searchRepository } from "@/server/repositories/searchRepository";
import { logger } from "@/shared/lib/logger";

const AI_MODEL = "gemini-flash-latest";
const CONTEXT_LOG_LIMIT = 15;

export async function POST(req: Request) {
  const user = await getOptionalAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();
  if (typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "A query is required" }, { status: 400 });
  }

  const logs = await searchRepository.recentLogsForContext(user.id);

  const context = logs.slice(0, CONTEXT_LOG_LIMIT).map((log) => ({
    type: log.type,
    vehicle: `${log.vehicle.make} ${log.vehicle.model}`,
    date: log.date,
    content: log.content,
  }));

  return NextResponse.json({
    aiResponse: await generateAnswer(query, context),
    localResults: context.slice(0, 5),
  });
}

async function generateAnswer(query: string, context: unknown[]): Promise<string> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim().length <= 10) {
    return "AI_API_KEY is not configured. Add it to your environment variables.";
  }

  const prompt = `You are MotoAssistant, an expert motorcycle AI mechanic.
The user asked: "${query}"

Here are their relevant logs from the database:
${JSON.stringify(context)}

INSTRUCTIONS:
1. If the user is asking about their personal logs (like "when was my last oil change"), answer using the provided JSON logs.
2. If the user asks a general motorcycle question (specs, maintenance tips, etc.), use your extensive internal knowledge to provide a helpful answer.
3. Be concise, friendly, and highly accurate.
4. Respond in plain text format but you can use newlines for readability. Do NOT use markdown bold/italic/headers.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: AI_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    logger.error("AI assistant request failed", error);

    // Rate limiting is worth telling the user about, since waiting fixes it.
    // Any other provider message is withheld — it can carry key or quota detail.
    const message = error instanceof Error ? error.message : "";
    if (message.includes("429")) {
      return "The AI quota is temporarily exhausted. Please wait a minute and try again. 🏍️";
    }
    return "The AI assistant is unavailable right now. Please try again shortly.";
  }
}
