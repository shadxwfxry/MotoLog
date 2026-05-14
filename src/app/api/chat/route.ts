import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { query } = await req.json();

  const vehicles = await prisma.vehicle.findMany({
    where: { userId: session.user.id },
    select: { id: true, make: true, model: true }
  });
  
  const vehicleIds = vehicles.map(v => v.id);

  const [recentRefuels, recentMaint] = await Promise.all([
    prisma.refuelingLog.findMany({
      where: { vehicleId: { in: vehicleIds } },
      orderBy: { date: "desc" },
      take: 25,
      include: { vehicle: { select: { make: true, model: true } } }
    }),
    prisma.maintenanceLog.findMany({
      where: { vehicleId: { in: vehicleIds } },
      orderBy: { date: "desc" },
      take: 25,
      include: { vehicle: { select: { make: true, model: true } } }
    })
  ]);

  const localResults: any[] = [];

  recentRefuels.forEach((log: any) => {
    localResults.push({ 
      type: "refuel", 
      vehicle: `${log.vehicle.make} ${log.vehicle.model}`, 
      date: log.date, 
      content: `Station: ${log.stationName || "Unknown"}, Cost: ${log.cost}, Liters: ${log.liters}, Odo: ${log.odometer}`, 
      raw: log 
    });
  });

  recentMaint.forEach((log: any) => {
    localResults.push({ 
      type: "maintenance", 
      vehicle: `${log.vehicle.make} ${log.vehicle.model}`, 
      date: log.date, 
      content: `${log.type}: ${log.description || "No description"}, Cost: ${log.cost}, Odo: ${log.odometer}`, 
      raw: log 
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
      const model = genAI.getGenerativeModel({ 
        model: "gemini-pro",
      });

      const prompt = `You are MotoAssistant, an expert motorcycle AI mechanic.
The user asked: "${query}"

Here are their relevant logs from the database:
${JSON.stringify(localResults.slice(0, 15))}

INSTRUCTIONS:
1. If the user is asking about their personal logs (like "when was my last oil change"), answer using the provided JSON logs.
2. If the user asks a general motorcycle question (like "what tire pressure", "how to bleed brakes", specs, news, etc.), you MUST use your Google Search tool to find the most accurate and up-to-date information from the web to answer them.
3. Be concise, friendly, and highly accurate.
4. Respond in plain text format but you can use newlines for readability. Do NOT use markdown bold/italic/headers.`;

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
