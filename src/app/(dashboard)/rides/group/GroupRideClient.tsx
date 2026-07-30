"use client";

import { useEffect, useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import { useGroupRide } from "@/features/multiplayer/useGroupRide";
import {
  createRideGroup,
  endRideGroup,
  joinRideGroup,
  leaveRideGroup,
  type RideGroupView,
} from "@/features/multiplayer/actions";
import type { ActionResult } from "@/server/actions/result";
import { RIDE_STATUSES, type RideStatusCode } from "@/features/multiplayer/transport/types";
import type { RiderMarker } from "@/features/trips/components/RouteMap";
import { useRideStore } from "@/store/rideStore";
import { LeaderboardPanel } from "./LeaderboardPanel";

const RouteMap = dynamicImport(() => import("@/features/trips/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />,
});

const STATUS_LABEL: Record<RideStatusCode, string> = {
  "need-stop": "🛑 Need a stop",
  fuel: "⛽ Fuel",
  ok: "👍 All good",
  "slow-down": "🐢 Slow down",
  emergency: "🚨 Emergency",
};

interface Props {
  userId: string;
  defaultNickname: string;
  configured: boolean;
  enabled: boolean;
  activeGroups: RideGroupView[];
}

export function GroupRideClient({
  userId,
  defaultNickname,
  configured,
  enabled,
  activeGroups,
}: Props) {
  const [group, setGroup] = useState<RideGroupView | null>(activeGroups[0] ?? null);
  const [nickname, setNickname] = useState(defaultNickname);
  const [rideName, setRideName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");

  const ride = useGroupRide({
    groupId: group?.id ?? null,
    userId,
    nickname,
    enabled: enabled && configured,
  });

  // Share this rider's own position with the group while a ride is recording.
  const fixes = useRideStore((s) => s.fixes);
  const latestFix = fixes.at(-1);
  useEffect(() => {
    if (!latestFix || !group) return;
    ride.publish({
      lat: latestFix.lat,
      lon: latestFix.lon,
      speedKph: latestFix.speedMps != null ? latestFix.speedMps * 3.6 : null,
      t: latestFix.t,
    });
  }, [latestFix, group, ride]);

  const markers = useMemo<RiderMarker[]>(() => {
    // Everyone else, from the transport…
    const riders: RiderMarker[] = [...ride.positions.values()]
      .filter((p) => p.userId !== userId)
      .map((p) => ({
        id: p.userId,
        lat: p.lat,
        lon: p.lon,
        label: p.nickname,
        sublabel: p.speedKph != null ? `${Math.round(p.speedKph)} km/h` : undefined,
      }));

    // …and this rider from the local GPS, which is fresher than the copy that
    // would come back over the channel — and does arrive while offline.
    if (latestFix) {
      riders.push({
        id: userId,
        lat: latestFix.lat,
        lon: latestFix.lon,
        label: nickname,
        sublabel: latestFix.speedMps != null ? `${Math.round(latestFix.speedMps * 3.6)} km/h` : undefined,
        isSelf: true,
      });
    }

    return riders;
  }, [ride.positions, userId, latestFix, nickname]);

  /**
   * Runs an action, surfacing its error and returning the payload on success.
   * Generic over T so the caller keeps the action's own result type rather than
   * having to narrow an untyped object.
   */
  const run = async <T,>(fn: () => Promise<ActionResult<T>>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);

    const result = await fn();
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return undefined;
    }
    return result.data;
  };

  const handleCreate = async () => {
    const created = await run(() => createRideGroup(rideName || "Group ride", nickname));
    if (created) setGroup(created);
  };

  const handleJoin = async () => {
    const joined = await run(() => joinRideGroup(joinCode, nickname));
    if (joined) setGroup(joined);
  };

  const handleLeave = async () => {
    if (!group) return;
    await run(() => leaveRideGroup(group.id));
    setGroup(null);
  };

  const handleEnd = async () => {
    if (!group) return;
    // `run` returns undefined for a void action too, so check the error state
    // rather than the payload here.
    const result = await endRideGroup(group.id);
    if (result.ok) setGroup(null);
    else setError(result.error);
  };

  if (!enabled) {
    return (
      <Notice
        title="Group rides are off"
        body="Set NEXT_PUBLIC_FEATURE_MULTIPLAYER=true to enable them."
      />
    );
  }

  if (!configured) {
    return (
      <Notice
        title="Group rides are not configured"
        body="This deployment is missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_JWT_SECRET."
      />
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-5 pb-24">
      <h1 className="text-2xl font-bold tracking-tight uppercase">Group ride</h1>

      {(error || ride.error) && (
        <p className="text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/30 rounded-xl px-3 py-2">
          {error ?? ride.error}
        </p>
      )}

      {!group ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card title="Start a ride">
            <Field label="Your nickname" value={nickname} onChange={setNickname} />
            <Field label="Ride name" value={rideName} onChange={setRideName} placeholder="Sunday loop" />
            <button
              onClick={handleCreate}
              disabled={busy}
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-black uppercase tracking-wider disabled:opacity-50"
            >
              Create
            </button>
          </Card>

          <Card title="Join a ride">
            <Field label="Your nickname" value={nickname} onChange={setNickname} />
            <Field
              label="Join code"
              value={joinCode}
              onChange={(v) => setJoinCode(v.toUpperCase())}
              placeholder="ABC123"
            />
            <button
              onClick={handleJoin}
              disabled={busy || joinCode.length !== 6}
              className="w-full h-12 rounded-xl bg-muted border border-border font-black uppercase tracking-wider disabled:opacity-50"
            >
              Join
            </button>
          </Card>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground">
                  {ride.riders.length || group.members.length} riders
                </p>
              </div>
              <ConnectionBadge state={ride.state} />
            </div>

            <div className="rounded-xl bg-muted/40 p-3 text-center">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                Join code
              </p>
              <p className="text-3xl font-black tracking-[0.3em] text-primary">{group.code}</p>
            </div>
          </div>

          <div className="h-72 rounded-2xl overflow-hidden border border-border">
            <RouteMap markers={markers} />
          </div>

          <div className="flex flex-wrap gap-2">
            {RIDE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => ride.sendStatus(status)}
                className="px-3 py-2 rounded-xl border border-border text-xs font-bold hover:border-primary hover:text-primary transition"
              >
                {STATUS_LABEL[status]}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div className="max-h-48 overflow-y-auto space-y-2">
              {ride.messages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No messages yet.</p>
              ) : (
                ride.messages.map((m) => (
                  <div key={m.id} className="text-xs">
                    <span className="font-bold text-primary">{m.nickname}: </span>
                    <span>{m.kind === "status" ? STATUS_LABEL[m.body as RideStatusCode] ?? m.body : m.body}</span>
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ride.sendChat(chatDraft);
                setChatDraft("");
              }}
              className="flex gap-2"
            >
              <input
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Message the group…"
                maxLength={200}
                className="flex-1 h-11 px-3 rounded-xl border border-border bg-background text-sm"
              />
              <button
                type="submit"
                className="px-4 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                Send
              </button>
            </form>
          </div>

          <LeaderboardPanel groupId={group.id} />

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleLeave}
              disabled={busy}
              className="h-12 rounded-xl border border-border text-xs font-bold uppercase tracking-widest disabled:opacity-50"
            >
              Leave ride
            </button>
            {group.ownerId === userId && (
              <button
                onClick={handleEnd}
                disabled={busy}
                className="h-12 rounded-xl bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
              >
                End for everyone
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ConnectionBadge({ state }: { state: string }) {
  const style =
    state === "connected"
      ? "bg-green-500/10 text-green-400 border-green-500/20"
      : state === "degraded"
      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
      : state === "connecting"
      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
      : "bg-muted text-muted-foreground border-border";

  // "degraded" means relay-only, which is fully functional — hence "Relay"
  // rather than anything that reads as an error.
  const label =
    state === "connected"
      ? "● Direct"
      : state === "degraded"
      ? "● Relay"
      : state === "connecting"
      ? "● Connecting"
      : "● Offline";

  return (
    <span className={`shrink-0 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${style}`}>
      {label}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm"
      />
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 pb-24">
      <div className="text-center py-20 rounded-3xl border-2 border-dashed border-border/50">
        <div className="text-5xl mb-4 opacity-20">🛰</div>
        <p className="font-bold mb-2">{title}</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">{body}</p>
      </div>
    </div>
  );
}
