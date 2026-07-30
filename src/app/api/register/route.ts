import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { userRepository } from "@/server/repositories/userRepository";
import { logger } from "@/shared/lib/logger";

const registerSchema = z.object({
  // Trimmed only. Case is deliberately preserved: the credentials provider
  // looks up the email exactly as typed, so lowercasing here would lock out
  // every existing account stored with capitals.
  email: z.string().trim().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().trim().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const { name, email, password } = validation.data;

    const existingUser = await userRepository.exists(email);
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({ name: name || null, email, passwordHash });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    logger.error("register failed", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
