import { beforeEach, describe, expect, it, vi } from "vitest";
import { HybridTransport } from "./HybridTransport";
import { SequenceFilter, SequenceGenerator } from "./dedupe";
import { type PeerCapableTransport } from "./HybridTransport";
import {
  EventBus,
  type ITransportProvider,
  type LivePosition,
  type RideChannelContext,
  type RideMessage,
  type TransportState,
} from "./types";

/** A transport whose delivery and failures the test drives directly. */
class FakeTransport implements ITransportProvider {
  private bus = new EventBus();
  state: TransportState = "idle";

  published: LivePosition[] = [];
  sent: RideMessage[] = [];
  connected = false;
  failOnConnect = false;

  constructor(readonly name: string) {}

  on = this.bus.on.bind(this.bus);

  async connect(_context: RideChannelContext) {
    if (this.failOnConnect) {
      this.setState("closed");
      throw new Error(`${this.name} unavailable`);
    }
    this.connected = true;
    this.setState("connected");
  }

  async disconnect() {
    this.connected = false;
    this.setState("closed");
  }

  publishPosition(position: LivePosition) {
    this.published.push(position);
  }

  sendMessage(message: RideMessage) {
    this.sent.push(message);
  }

  /** Simulates an inbound update arriving over this path. */
  deliver(position: LivePosition) {
    this.bus.emit("position", position);
  }

  deliverMessage(message: RideMessage) {
    this.bus.emit("message", message);
  }

  deliverPresence(riders: { userId: string; nickname: string; onlineAt: number }[]) {
    this.bus.emit("presence", riders);
  }

  setState(state: TransportState) {
    this.state = state;
    this.bus.emit("state", state);
  }
}

/** Records which peers the hybrid dialled and dropped, without touching WebRTC. */
class FakePeerTransport extends FakeTransport implements PeerCapableTransport {
  dialled: string[] = [];
  dropped: string[] = [];
  connectedPeerIds: string[] = [];

  async connectToPeer(peerId: string) {
    if (this.dialled.includes(peerId)) return;
    this.dialled.push(peerId);
    this.connectedPeerIds = [...this.connectedPeerIds, peerId];
  }

  dropPeer(peerId: string) {
    this.dropped.push(peerId);
    this.connectedPeerIds = this.connectedPeerIds.filter((id) => id !== peerId);
  }
}

const context: RideChannelContext = { groupId: "g1", userId: "me", nickname: "Me" };

const presence = (...userIds: string[]) =>
  userIds.map((userId) => ({ userId, nickname: userId, onlineAt: 0 }));

const position = (userId: string, seq: number, lat = 50): LivePosition => ({
  userId,
  nickname: userId,
  lat,
  lon: 30,
  speedKph: 60,
  headingDeg: null,
  t: seq * 1000,
  seq,
});

const message = (userId: string, seq: number, body = "hi"): RideMessage => ({
  id: `${userId}-${seq}`,
  userId,
  nickname: userId,
  kind: "chat",
  body,
  t: seq * 1000,
  seq,
});

describe("HybridTransport", () => {
  let relay: FakeTransport;
  let p2p: FakeTransport;
  let hybrid: HybridTransport;

  beforeEach(() => {
    relay = new FakeTransport("relay");
    p2p = new FakeTransport("p2p");
    hybrid = new HybridTransport(relay, p2p);
  });

  it("delivers an update once when both paths carry it", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    // P2P wins the race; the relay copy arrives moments later.
    p2p.deliver(position("rider-a", 1));
    relay.deliver(position("rider-a", 1));

    expect(received).toHaveLength(1);
  });

  it("keeps whichever copy arrives first, whichever path that is", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    relay.deliver(position("rider-a", 1, 50));
    p2p.deliver(position("rider-a", 1, 51));

    expect(received).toHaveLength(1);
    expect(received[0].lat).toBe(50);
  });

  it("passes successive updates through", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    p2p.deliver(position("rider-a", 1));
    relay.deliver(position("rider-a", 2));
    p2p.deliver(position("rider-a", 3));

    expect(received.map((p) => p.seq)).toEqual([1, 2, 3]);
  });

  it("drops an update that overtook a newer one in flight", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    relay.deliver(position("rider-a", 5));
    // A delayed older position would otherwise jump the marker backwards.
    p2p.deliver(position("rider-a", 3));

    expect(received.map((p) => p.seq)).toEqual([5]);
  });

  it("tracks riders independently", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    relay.deliver(position("rider-a", 7));
    relay.deliver(position("rider-b", 1));

    expect(received).toHaveLength(2);
  });

  it("de-duplicates chat as well as positions", async () => {
    await hybrid.connect(context);
    const received: RideMessage[] = [];
    hybrid.on("message", (m) => received.push(m));

    p2p.deliverMessage(message("rider-a", 1, "fuel stop"));
    relay.deliverMessage(message("rider-a", 1, "fuel stop"));

    expect(received).toHaveLength(1);
    expect(received[0].body).toBe("fuel stop");
  });

  it("keeps delivering over the relay after P2P drops mid-ride", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    p2p.deliver(position("rider-a", 1));
    // The peer connection fails; the relay is untouched underneath.
    p2p.setState("closed");
    relay.deliver(position("rider-a", 2));

    expect(received.map((p) => p.seq)).toEqual([1, 2]);
  });

  it("still connects when P2P cannot start at all", async () => {
    p2p.failOnConnect = true;

    await expect(hybrid.connect(context)).resolves.toBeUndefined();
    expect(relay.connected).toBe(true);

    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));
    relay.deliver(position("rider-a", 1));

    expect(received).toHaveLength(1);
  });

  it("reports degraded while only the relay is carrying", async () => {
    p2p.failOnConnect = true;
    await hybrid.connect(context);

    // Reachable, just not by the preferred path — an indicator, not an error.
    expect(hybrid.state).toBe("degraded");
  });

  it("reports connected once P2P is up too", async () => {
    await hybrid.connect(context);

    expect(hybrid.state).toBe("connected");
  });

  it("follows the relay when the relay itself goes down", async () => {
    await hybrid.connect(context);
    relay.setState("closed");

    expect(hybrid.state).toBe("closed");
  });

  it("publishes on both paths so neither peer is missed", async () => {
    await hybrid.connect(context);
    hybrid.publishPosition(position("me", 1));

    expect(relay.published).toHaveLength(1);
    expect(p2p.published).toHaveLength(1);
  });

  it("takes presence from the relay only", async () => {
    await hybrid.connect(context);
    const seen: string[][] = [];
    hybrid.on("presence", (riders) => seen.push(riders.map((r) => r.userId)));

    // P2P sees only the peers it reached, so its roster would be incomplete.
    p2p.deliverPresence([{ userId: "rider-a", nickname: "A", onlineAt: 0 }]);
    relay.deliverPresence([
      { userId: "rider-a", nickname: "A", onlineAt: 0 },
      { userId: "rider-b", nickname: "B", onlineAt: 0 },
    ]);

    expect(seen).toEqual([["rider-a", "rider-b"]]);
  });

  it("accepts a rejoining rider whose counter restarted", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    relay.deliver(position("rider-a", 9));
    hybrid.forgetRider("rider-a");
    relay.deliver(position("rider-a", 1));

    expect(received.map((p) => p.seq)).toEqual([9, 1]);
  });

  it("works with no P2P transport at all", async () => {
    const relayOnly = new HybridTransport(relay, null);
    await relayOnly.connect(context);

    const received: LivePosition[] = [];
    relayOnly.on("position", (p) => received.push(p));
    relay.deliver(position("rider-a", 1));

    expect(received).toHaveLength(1);
    expect(relayOnly.state).toBe("degraded");
  });

  it("stops delivering after disconnect", async () => {
    await hybrid.connect(context);
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    await hybrid.disconnect();
    relay.deliver(position("rider-a", 1));

    expect(received).toHaveLength(0);
    expect(relay.connected).toBe(false);
    expect(p2p.connected).toBe(false);
  });
});

describe("HybridTransport — peer mesh", () => {
  let relay: FakeTransport;
  let p2p: FakePeerTransport;
  let hybrid: HybridTransport;

  beforeEach(async () => {
    relay = new FakeTransport("relay");
    p2p = new FakePeerTransport("p2p");
    hybrid = new HybridTransport(relay, p2p);
    await hybrid.connect(context);
  });

  it("dials the riders presence reports, but never itself", () => {
    relay.deliverPresence(presence("me", "rider-a", "rider-b"));

    expect(p2p.dialled).toEqual(["rider-a", "rider-b"]);
  });

  it("does not redial a peer on every presence sync", () => {
    relay.deliverPresence(presence("me", "rider-a"));
    relay.deliverPresence(presence("me", "rider-a"));

    expect(p2p.dialled).toEqual(["rider-a"]);
  });

  it("drops the connection to a rider who left", () => {
    relay.deliverPresence(presence("me", "rider-a", "rider-b"));
    relay.deliverPresence(presence("me", "rider-a"));

    expect(p2p.dropped).toEqual(["rider-b"]);
  });

  it("accepts a departed rider's restarted counter when they rejoin", async () => {
    const received: LivePosition[] = [];
    hybrid.on("position", (p) => received.push(p));

    relay.deliverPresence(presence("me", "rider-a"));
    relay.deliver(position("rider-a", 9));

    // They ride out of range and come back with a fresh sequence.
    relay.deliverPresence(presence("me"));
    relay.deliverPresence(presence("me", "rider-a"));
    relay.deliver(position("rider-a", 1));

    expect(received.map((p) => p.seq)).toEqual([9, 1]);
  });

  it("does nothing peer-related when there is no P2P transport", async () => {
    const relayOnly = new FakeTransport("relay");
    const noP2p = new HybridTransport(relayOnly, null);
    await noP2p.connect(context);

    expect(() => relayOnly.deliverPresence(presence("me", "rider-a"))).not.toThrow();
  });
});

describe("SequenceFilter", () => {
  it("accepts each sequence once", () => {
    const filter = new SequenceFilter();

    expect(filter.accept({ userId: "a", seq: 1 })).toBe(true);
    expect(filter.accept({ userId: "a", seq: 1 })).toBe(false);
  });

  it("scopes sequences per sender", () => {
    const filter = new SequenceFilter();
    filter.accept({ userId: "a", seq: 5 });

    expect(filter.accept({ userId: "b", seq: 1 })).toBe(true);
  });

  it("forgets a sender on request", () => {
    const filter = new SequenceFilter();
    filter.accept({ userId: "a", seq: 5 });
    filter.forget("a");

    expect(filter.accept({ userId: "a", seq: 1 })).toBe(true);
  });
});

describe("SequenceGenerator", () => {
  it("increases monotonically from one", () => {
    const gen = new SequenceGenerator();

    expect([gen.next(), gen.next(), gen.next()]).toEqual([1, 2, 3]);
  });
});

describe("EventBus", () => {
  it("keeps notifying subscribers when one throws", () => {
    const bus = new EventBus();
    const second = vi.fn();

    bus.on("state", () => {
      throw new Error("subscriber blew up");
    });
    bus.on("state", second);

    expect(() => bus.emit("state", "connected")).not.toThrow();
    expect(second).toHaveBeenCalledWith("connected");
  });

  it("tolerates a handler unsubscribing during emit", () => {
    const bus = new EventBus();
    const later = vi.fn();

    const off = bus.on("state", () => off());
    bus.on("state", later);

    expect(() => bus.emit("state", "connected")).not.toThrow();
    expect(later).toHaveBeenCalled();
  });
});
