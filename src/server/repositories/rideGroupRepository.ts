import { prisma } from "@/server/db";

/**
 * Join codes.
 *
 * Read aloud between riders at a petrol stop, so the alphabet excludes the
 * characters that get confused when spoken or seen through a visor: O/0, I/1/L,
 * and the vowels that let a code spell something unfortunate.
 */
const CODE_ALPHABET = "BCDFGHJKMNPQRSTVWXYZ23456789";
const CODE_LENGTH = 6;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

const groupInclude = {
  members: {
    where: { leftAt: null },
    select: { userId: true, nickname: true, joinedAt: true },
  },
} as const;

export const rideGroupRepository = {
  /**
   * Creates a group with a unique join code.
   *
   * Retries on collision rather than pre-checking: the code space is 28^6
   * (~480M), so a collision is vanishingly rare, and relying on the unique
   * constraint avoids a check-then-insert race between two riders creating a
   * group at the same instant.
   */
  async create(ownerId: string, name: string, nickname: string) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        return await prisma.rideGroup.create({
          data: {
            code: generateCode(),
            name,
            ownerId,
            members: { create: { userId: ownerId, nickname } },
          },
          include: groupInclude,
        });
      } catch (error) {
        const isCodeCollision =
          typeof error === "object" &&
          error !== null &&
          (error as { code?: string }).code === "P2002";
        if (!isCodeCollision) throw error;
      }
    }
    throw new Error("Could not allocate a unique join code");
  },

  findActiveByCode(code: string) {
    return prisma.rideGroup.findFirst({
      where: { code: code.trim().toUpperCase(), isActive: true },
      include: groupInclude,
    });
  },

  findById(groupId: string) {
    return prisma.rideGroup.findUnique({ where: { id: groupId }, include: groupInclude });
  },

  /**
   * Adds a rider, or reinstates one who had left. Upsert on (groupId, userId)
   * so rejoining after a dropped connection does not create a duplicate row.
   */
  join(groupId: string, userId: string, nickname: string) {
    return prisma.rideGroupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      update: { nickname, leftAt: null },
      create: { groupId, userId, nickname },
    });
  },

  leave(groupId: string, userId: string) {
    return prisma.rideGroupMember.updateMany({
      where: { groupId, userId, leftAt: null },
      data: { leftAt: new Date() },
    });
  },

  async endRide(groupId: string, ownerId: string) {
    const result = await prisma.rideGroup.updateMany({
      where: { id: groupId, ownerId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });
    return result.count > 0;
  },

  isMember(groupId: string, userId: string) {
    return prisma.rideGroupMember
      .findFirst({ where: { groupId, userId, leftAt: null }, select: { id: true } })
      .then(Boolean);
  },

  /** Active groups the user belongs to — the scope claim in the realtime token. */
  activeGroupIdsFor(userId: string) {
    return prisma.rideGroupMember
      .findMany({
        where: { userId, leftAt: null, group: { isActive: true } },
        select: { groupId: true },
      })
      .then((rows) => rows.map((r) => r.groupId));
  },

  listActiveForUser(userId: string) {
    return prisma.rideGroup.findMany({
      where: { isActive: true, members: { some: { userId, leftAt: null } } },
      include: groupInclude,
      orderBy: { startedAt: "desc" },
    });
  },
};

export const friendshipRepository = {
  /** Accepted friends in both directions — friendship is symmetric once accepted. */
  async friendIdsOf(userId: string): Promise<string[]> {
    const rows = await prisma.friendship.findMany({
      where: {
        status: "accepted",
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      select: { requesterId: true, addresseeId: true },
    });

    return rows.map((r) => (r.requesterId === userId ? r.addresseeId : r.requesterId));
  },
};
