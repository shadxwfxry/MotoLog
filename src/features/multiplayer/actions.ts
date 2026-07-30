"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthUser } from "@/server/auth/guards";
import {
  friendshipRepository,
  rideGroupRepository,
} from "@/server/repositories/rideGroupRepository";
import { tripRepository } from "@/server/repositories/tripRepository";
import { userRepository } from "@/server/repositories/userRepository";
import { type ActionResult, fail, ok, runAction } from "@/server/actions/result";

const createGroupSchema = z.object({
  name: z.string().trim().min(1, "Give the ride a name").max(60),
  nickname: z.string().trim().min(1, "Choose a nickname").max(30),
});

const joinGroupSchema = z.object({
  code: z.string().trim().toUpperCase().length(6, "A join code is 6 characters"),
  nickname: z.string().trim().min(1, "Choose a nickname").max(30),
});

export interface RideGroupView {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  members: { userId: string; nickname: string }[];
}

export async function createRideGroup(
  name: string,
  nickname: string,
): Promise<ActionResult<RideGroupView>> {
  return runAction("createRideGroup", async () => {
    const user = await getAuthUser();

    const validation = createGroupSchema.safeParse({ name, nickname });
    if (!validation.success) return fail(validation.error.issues[0].message);

    const group = await rideGroupRepository.create(
      user.id,
      validation.data.name,
      validation.data.nickname,
    );

    revalidatePath("/rides/group");
    return ok(toView(group));
  });
}

export async function joinRideGroup(
  code: string,
  nickname: string,
): Promise<ActionResult<RideGroupView>> {
  return runAction("joinRideGroup", async () => {
    const user = await getAuthUser();

    const validation = joinGroupSchema.safeParse({ code, nickname });
    if (!validation.success) return fail(validation.error.issues[0].message);

    const group = await rideGroupRepository.findActiveByCode(validation.data.code);
    if (!group) return fail("No active ride found for that code");

    await rideGroupRepository.join(group.id, user.id, validation.data.nickname);

    // Re-read so the returned roster includes the rider who just joined.
    const updated = await rideGroupRepository.findById(group.id);
    if (!updated) return fail("Ride is no longer available");

    revalidatePath("/rides/group");
    return ok(toView(updated));
  });
}

export async function leaveRideGroup(groupId: string): Promise<ActionResult> {
  return runAction("leaveRideGroup", async () => {
    const user = await getAuthUser();
    await rideGroupRepository.leave(groupId, user.id);

    revalidatePath("/rides/group");
    return ok();
  });
}

export async function endRideGroup(groupId: string): Promise<ActionResult> {
  return runAction("endRideGroup", async () => {
    const user = await getAuthUser();

    const ended = await rideGroupRepository.endRide(groupId, user.id);
    if (!ended) return fail("Only the ride owner can end it");

    revalidatePath("/rides/group");
    return ok();
  });
}

export interface LeaderboardRow {
  userId: string;
  name: string;
  trips: number;
  distanceM: number;
  durationS: number;
  avgSpeedKph: number | null;
  maxSpeedKph: number | null;
}

/**
 * Leaderboard for the "Crew" and "Friends" tabs.
 *
 * Totals are aggregated in Postgres and compared across whole ride histories,
 * so the query cost does not grow with how much everyone has ridden.
 */
export async function getLeaderboard(
  scope: "crew" | "friends",
  groupId?: string,
): Promise<ActionResult<LeaderboardRow[]>> {
  return runAction("getLeaderboard", async () => {
    const user = await getAuthUser();

    let userIds: string[];

    if (scope === "crew") {
      if (!groupId) return fail("A ride is required for the crew leaderboard");
      // Membership is checked before revealing anyone else's totals.
      if (!(await rideGroupRepository.isMember(groupId, user.id))) {
        return fail("You are not part of this ride");
      }
      const group = await rideGroupRepository.findById(groupId);
      userIds = group?.members.map((m) => m.userId) ?? [];
    } else {
      userIds = [user.id, ...(await friendshipRepository.friendIdsOf(user.id))];
    }

    const [totals, names] = await Promise.all([
      tripRepository.leaderboard(userIds),
      Promise.all(userIds.map((id) => userRepository.findById(id))),
    ]);

    const nameById = new Map(names.filter(Boolean).map((u) => [u!.id, u!.name ?? "Rider"]));

    return ok(
      totals
        .map((row) => ({ ...row, name: nameById.get(row.userId) ?? "Rider" }))
        .sort((a, b) => b.distanceM - a.distanceM),
    );
  });
}

function toView(group: {
  id: string;
  code: string;
  name: string;
  ownerId: string;
  members: { userId: string; nickname: string }[];
}): RideGroupView {
  return {
    id: group.id,
    code: group.code,
    name: group.name,
    ownerId: group.ownerId,
    members: group.members.map((m) => ({ userId: m.userId, nickname: m.nickname })),
  };
}
