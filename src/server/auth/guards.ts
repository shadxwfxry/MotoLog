import "server-only";

import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth/options";
import { userRepository } from "@/server/repositories/userRepository";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
}

/**
 * The signed-in user, or throws. Sessions minted before the `id` claim was
 * added carry only an email, so fall back to a lookup rather than logging
 * those users out.
 */
export async function getAuthUser(): Promise<AuthUser> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new UnauthorizedError();

  if (session.user.id) {
    return { id: session.user.id, email: session.user.email, name: session.user.name };
  }

  const dbUser = await userRepository.findByEmail(session.user.email);
  if (!dbUser) throw new UnauthorizedError();

  return { id: dbUser.id, email: dbUser.email, name: dbUser.name };
}

/** The signed-in user, or null — for pages that render a public variant. */
export async function getOptionalAuthUser(): Promise<AuthUser | null> {
  try {
    return await getAuthUser();
  } catch {
    return null;
  }
}

/** Throws unless `userId` owns `vehicleId`. */
export async function assertVehicleOwnership(vehicleId: string, userId: string): Promise<void> {
  const ownerId = await vehicleRepository.findOwnerId(vehicleId);
  if (ownerId !== userId) throw new ForbiddenError("You do not own this vehicle");
}
