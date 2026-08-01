"use client";

import { useEffect, useMemo, useState } from "react";
import dynamicImport from "next/dynamic";
import { LogOut, MessageSquare, Radio, Send, Users } from "lucide-react";
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
import { Badge, EmptyState, Panel, PanelTitle, PageHeader, PageShell } from "@/shared/ui";
import type { Tone } from "@/shared/ui";
import { LeaderboardPanel } from "./LeaderboardPanel";

const RouteMap = dynamicImport(() => import("@/features/trips/components/RouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
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
        sublabel:
          latestFix.speedMps != null ? `${Math.round(latestFix.speedMps * 3.6)} km/h` : undefined,
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
    <PageShell>
      <PageHeader
        eyebrow="Live"
        title="Group ride"
        action={group ? <ConnectionBadge state={ride.state} /> : undefined}
      />

      {(error || ride.error) && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs font-semibold text-destructive">
          {error ?? ride.error}
        </p>
      )}

      {!group ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <Panel corners>
            <PanelTitle icon={<Radio size={13} strokeWidth={2.6} />}>Start a ride</PanelTitle>
            <div className="space-y-3">
              <Field label="Your nickname" value={nickname} onChange={setNickname} />
              <Field
                label="Ride name"
                value={rideName}
                onChange={setRideName}
                placeholder="Sunday loop"
              />
              <button onClick={handleCreate} disabled={busy} className="btn-primary h-12 w-full">
                Create
              </button>
            </div>
          </Panel>

          <Panel>
            <PanelTitle icon={<Users size={13} strokeWidth={2.6} />}>Join a ride</PanelTitle>
            <div className="space-y-3">
              <Field label="Your nickname" value={nickname} onChange={setNickname} />
              <Field
                label="Join code"
                value={joinCode}
                onChange={(v) => setJoinCode(v.toUpperCase())}
                placeholder="ABC123"
                className="num text-center text-lg tracking-[0.4em]"
              />
              <button
                onClick={handleJoin}
                disabled={busy || joinCode.length !== 6}
                className="btn-ghost h-12 w-full"
              >
                Join
              </button>
            </div>
          </Panel>
        </div>
      ) : (
        <>
          {/* The join code is the one thing riders read aloud to each other, so
              it gets the display treatment rather than sitting in a grey box. */}
          <Panel corners sweep className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-black uppercase tracking-tight">
                  {group.name}
                </p>
                <p className="num text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                  {ride.riders.length || group.members.length} riders
                </p>
              </div>
            </div>

            <div className="rounded-md border border-primary/25 bg-primary/[0.06] py-5 text-center">
              <p className="label-micro">Join code</p>
              <p className="num mt-1 text-4xl font-black tracking-[0.35em] text-primary text-glow sm:text-5xl">
                {group.code}
              </p>
            </div>
          </Panel>

          <Panel padding="none" className="overflow-hidden">
            <div className="h-72 w-full sm:h-80">
              <RouteMap markers={markers} />
            </div>
          </Panel>

          <div className="flex flex-wrap gap-2">
            {RIDE_STATUSES.map((status) => (
              <button
                key={status}
                onClick={() => ride.sendStatus(status)}
                className="chip transition-all hover:border-primary/50 hover:text-primary"
              >
                {STATUS_LABEL[status]}
              </button>
            ))}
          </div>

          <Panel>
            <PanelTitle icon={<MessageSquare size={13} strokeWidth={2.6} />}>Chat</PanelTitle>

            <div className="mb-3 max-h-48 space-y-2 overflow-y-auto">
              {ride.messages.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">No messages yet.</p>
              ) : (
                ride.messages.map((m) => (
                  <div key={m.id} className="text-xs leading-relaxed">
                    <span className="font-bold text-primary">{m.nickname}: </span>
                    <span>
                      {m.kind === "status"
                        ? (STATUS_LABEL[m.body as RideStatusCode] ?? m.body)
                        : m.body}
                    </span>
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
                className="field flex-1 py-2.5"
              />
              <button type="submit" className="btn-primary h-11 w-11 shrink-0" aria-label="Send">
                <Send size={16} strokeWidth={2.6} />
              </button>
            </form>
          </Panel>

          <LeaderboardPanel groupId={group.id} />

          <div className="grid grid-cols-2 gap-3">
            <button onClick={handleLeave} disabled={busy} className="btn-ghost h-12">
              <LogOut size={14} strokeWidth={2.6} />
              Leave ride
            </button>
            {group.ownerId === userId && (
              <button
                onClick={handleEnd}
                disabled={busy}
                className="btn h-12 border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                End for everyone
              </button>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}

function ConnectionBadge({ state }: { state: string }) {
  // "degraded" means relay-only, which is fully functional — hence "Relay"
  // rather than anything that reads as an error.
  const map: Record<string, { tone: Tone; label: string; pulse: boolean }> = {
    connected: { tone: "lime", label: "Direct", pulse: false },
    degraded: { tone: "amber", label: "Relay", pulse: false },
    connecting: { tone: "cyan", label: "Connecting", pulse: true },
  };
  const view = map[state] ?? { tone: "default" as Tone, label: "Offline", pulse: false };

  return (
    <Badge tone={view.tone} dot pulse={view.pulse}>
      {view.label}
    </Badge>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="label-micro">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`field py-2.5 ${className ?? ""}`}
      />
    </div>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <PageShell>
      <EmptyState
        icon={<Radio size={44} strokeWidth={1.5} />}
        title={title}
        description={body}
      />
    </PageShell>
  );
}
