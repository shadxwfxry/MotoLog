import { redirect } from "next/navigation";
import { getOptionalAuthUser } from "@/server/auth/guards";
import { rideGroupRepository } from "@/server/repositories/rideGroupRepository";
import { isRealtimeConfigured } from "@/server/auth/supabaseJwt";
import { GroupRideClient } from "./GroupRideClient";

export const dynamic = "force-dynamic";

export default async function GroupRidePage() {
  const user = await getOptionalAuthUser();
  if (!user) redirect("/login");

  const groups = await rideGroupRepository.listActiveForUser(user.id);

  return (
    <GroupRideClient
      userId={user.id}
      defaultNickname={user.name ?? "Rider"}
      // Two independent gates: the deployment must have Supabase realtime
      // credentials, and the feature flag must be on.
      configured={isRealtimeConfigured()}
      enabled={process.env.NEXT_PUBLIC_FEATURE_MULTIPLAYER === "true"}
      activeGroups={groups.map((g) => ({
        id: g.id,
        code: g.code,
        name: g.name,
        ownerId: g.ownerId,
        members: g.members.map((m) => ({ userId: m.userId, nickname: m.nickname })),
      }))}
    />
  );
}
