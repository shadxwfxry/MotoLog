import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email: session.user.email as string },
    include: { vehicles: { include: { refuelingLogs: true, maintenanceLogs: true } } }
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const localResults: any[] = [];

  user.vehicles.forEach((v: any) => {
    v.refuelingLogs.forEach((log: any) => {
      localResults.push({ type: "refuel", vehicle: `${v.make} ${v.model}`, date: log.date, content: `Station: ${log.stationName || "Unknown"}, Cost: ${log.cost}, Liters: ${log.liters}, Odo: ${log.odometer}`, raw: log });
    });
    v.maintenanceLogs.forEach((log: any) => {
      localResults.push({ type: "maintenance", vehicle: `${v.make} ${v.model}`, date: log.date, content: `${log.type}: ${log.description || "No description"}, Cost: ${log.cost}, Odo: ${log.odometer}`, raw: log });
    });
  });

  // Sort by date descending
  localResults.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. AI Logic using Google Generative AI
  const apiKey = process.env.AI_API_KEY;
  let aiResponse = "";

  if (apiKey && apiKey.trim().length > 10) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

      const prompt = `You are MotoAssistant, a helpful AI for a motorcycle app.
The user asked: "${query}"

Here are their relevant logs from the database:
${JSON.stringify(localResults.slice(0, 50))}

If the user is asking about their logs (like "when was my last oil change" or "how many liters did I refuel"), answer using the provided logs. 
If no logs are relevant, answer their general motorcycle question naturally. Be concise and helpful.
IMPORTANT: Respond in plain text ONLY. Do NOT use any Markdown formatting (no asterisks for bold/italic, no hashes for headers, no bullet points).`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      aiResponse = response.text();
    } catch (e: any) {
      aiResponse = `Error contacting AI: ${e.message}. Please check if your AI_API_KEY is correct.`;
    }
  } else {
    aiResponse = `Search results for "${query}": Found ${localResults.length} matching entries in your history. (AI features disabled - please set a valid AI_API_KEY in your .env file)`;
  }

  // Clean up 'raw' data before sending to client
  const cleanResults = localResults.map(r => ({ ...r, raw: undefined }));

  return NextResponse.json({
    aiResponse,
    localResults: cleanResults.slice(0, 5)
  });
}
