"use server";

import { getAuthUser } from "@/server/auth/guards";
import { searchRepository } from "@/server/repositories/searchRepository";
import { type ActionResult, ok, runAction } from "@/server/actions/result";
import { serializeForClient, type Serialized } from "@/shared/lib/serialize";
import type { LogSearchHit } from "@/server/repositories/searchRepository";

export type LogSearchResult = Serialized<LogSearchHit>;

export async function searchLogs(query: string): Promise<ActionResult<LogSearchResult[]>> {
  return runAction("searchLogs", async () => {
    const user = await getAuthUser();
    const hits = await searchRepository.searchLogs(user.id, query);
    return ok(serializeForClient(hits));
  });
}
